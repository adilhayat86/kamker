"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { reviewProofWithAi } from "@/lib/ai-proof-review";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numericField(formData: FormData, key: string) {
  const value = Number(field(formData, key));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export async function submitProofForReview(formData: FormData) {
  const reviewType = field(formData, "reviewType") || "general";
  const relatedId = field(formData, "relatedId");
  const expectedAmountPkr = numericField(formData, "expectedAmountPkr");
  const image = formData.get("proofImage");

  if (!(image instanceof File) || image.size === 0 || !expectedAmountPkr) {
    redirect("/proof-upload?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/proof-upload?status=not-configured");
  }

  const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${reviewType}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("proof-images")
    .upload(filePath, image, {
      cacheControl: "3600",
      contentType: image.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Failed to upload proof image", uploadError);
    redirect("/proof-upload?status=upload-error");
  }

  const { data: publicUrlData } = supabase.storage
    .from("proof-images")
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;
  const review = await reviewProofWithAi({ imageUrl, expectedAmountPkr });

  const { error: insertError } = await supabase.from("proof_reviews").insert({
    review_type: reviewType,
    related_id: relatedId || null,
    expected_amount_pkr: expectedAmountPkr,
    image_url: imageUrl,
    ai_readable: review.readable,
    ai_detected_amount_pkr: review.detectedAmountPkr,
    ai_detected_reference: review.detectedReference,
    ai_detected_method: review.detectedMethod,
    ai_detected_date: review.detectedDate,
    ai_confidence: review.confidence,
    ai_decision: review.decision,
    ai_notes: review.notes,
    audit_status: "unchecked",
  });

  if (insertError) {
    console.error("Failed to save proof review", insertError);
    redirect("/proof-upload?status=save-error");
  }

  redirect(`/proof-upload?status=${review.decision}`);
}
