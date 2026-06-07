"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionProfessional } from "@/lib/auth";
import { canAutoApproveProof, reviewProofWithAi } from "@/lib/ai-proof-review";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";

const featuredPackages = {
  monthly: {
    title: "Monthly Featured",
    amountPkr: 350,
    durationDays: 30,
  },
  yearly: {
    title: "1 Year Featured",
    amountPkr: 2500,
    durationDays: 365,
  },
} as const;

const allowedProofTypes = ["image/jpeg", "image/png", "image/webp"];
const maxProofSize = 8 * 1024 * 1024;

type FeaturedPackageKey = keyof typeof featuredPackages;

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function isFeaturedPackageKey(value: string): value is FeaturedPackageKey {
  return value === "monthly" || value === "yearly";
}

function featuredUntil(currentValue: string | null, durationDays: number) {
  const now = new Date();
  const currentExpiry = currentValue ? new Date(currentValue) : null;
  const start =
    currentExpiry && currentExpiry > now ? currentExpiry.getTime() : now.getTime();

  return new Date(start + durationDays * 24 * 60 * 60 * 1000).toISOString();
}

export async function submitFeaturedProfileProof(formData: FormData) {
  const packageKey = field(formData, "packageKey");
  const proofImage = formData.get("proofImage");

  if (!isFeaturedPackageKey(packageKey)) {
    redirect("/account/featured?status=missing");
  }

  if (
    !(proofImage instanceof File) ||
    proofImage.size === 0 ||
    !allowedProofTypes.includes(proofImage.type) ||
    proofImage.size > maxProofSize
  ) {
    redirect("/account/featured?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/account/featured?status=not-configured");
  }

  const professional = await getSessionProfessional();

  if (!professional) {
    redirect("/login");
  }

  const selectedPackage = featuredPackages[packageKey];
  const extension = proofImage.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `featured_profile/${professional.id}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("proof-images")
    .upload(filePath, proofImage, {
      cacheControl: "3600",
      contentType: proofImage.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Failed to upload featured profile proof", uploadError);
    redirect("/account/featured?status=upload-error");
  }

  const { data: publicUrlData } = supabase.storage
    .from("proof-images")
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;
  const review = await reviewProofWithAi({
    imageUrl,
    expectedAmountPkr: selectedPackage.amountPkr,
  });

  const autoApproved = canAutoApproveProof(review, selectedPackage.amountPkr);
  const { data: proofReview, error: insertError } = await supabase
    .from("proof_reviews")
    .insert({
      review_type: "featured_profile",
      related_id: professional.id,
      expected_amount_pkr: selectedPackage.amountPkr,
      image_url: imageUrl,
      ai_readable: review.readable,
      ai_detected_amount_pkr: review.detectedAmountPkr,
      ai_detected_reference: review.detectedReference,
      ai_detected_method: review.detectedMethod,
      ai_detected_date: review.detectedDate,
      ai_confidence: review.confidence,
      ai_decision: autoApproved ? "auto_approved" : "needs_review",
      ai_notes: `${selectedPackage.title}. ${review.notes}`,
      audit_status: autoApproved ? "auto_approved" : "unchecked",
    })
    .select("id")
    .single();

  if (insertError || !proofReview) {
    console.error("Failed to save featured profile proof review", insertError);
    redirect("/account/featured?status=save-error");
  }

  if (autoApproved) {
    const nextFeaturedUntil = featuredUntil(
      professional.featured_until,
      selectedPackage.durationDays,
    );
    const { error: updateError } = await supabase
      .from("professionals")
      .update({
        is_featured: true,
        featured_until: nextFeaturedUntil,
      })
      .eq("id", professional.id);

    if (updateError) {
      console.error("Failed to activate featured profile", updateError);
      redirect("/account/featured?status=activation-error");
    }

    revalidatePath("/account");
    revalidatePath("/account/featured");
    revalidatePath("/professionals");
    revalidatePath(`/professionals/${professional.id}`);
  }

  await sendAdminWhatsappAlert(
    [
      "Featured profile proof uploaded:",
      `Professional: ${professional.full_name}`,
      `Profile ID: ${professional.id}`,
      `Package: ${selectedPackage.title}`,
      `Expected amount: Rs ${selectedPackage.amountPkr}`,
      `AI decision: ${autoApproved ? "auto_approved" : "needs_review"}`,
      `AI amount: ${review.detectedAmountPkr ? `Rs ${review.detectedAmountPkr}` : "Not detected"}`,
      "Admin: proof_reviews / featured professionals",
    ].join("\n"),
    "featured_profile",
    proofReview.id as string,
  );

  redirect(
    `/account/featured?status=${autoApproved ? "auto_approved" : "needs_review"}`,
  );
}
