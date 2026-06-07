"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canAutoApproveProof, reviewProofWithAi } from "@/lib/ai-proof-review";
import { recordAdminAudit } from "@/lib/admin-audit";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";

const allowedProofTypes = ["image/jpeg", "image/png", "image/webp"];
const maxProofSize = 3 * 1024 * 1024;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToPayment(companyId: string, packageKey: string, status: string): never {
  redirect(
    `/companies/${companyId}/payment?package=${encodeURIComponent(packageKey)}&status=${status}`,
  );
}

function redirectToDashboard(companyId: string, status: string): never {
  redirect(`/companies/${companyId}/dashboard?status=${status}`);
}

function packageExpiry(durationDays: number) {
  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  return {
    startsAt: startsAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function submitCompanyPackagePayment(formData: FormData) {
  const companyId = field(formData, "companyId");
  const packageKey = field(formData, "packageKey");
  const paymentMethod = field(formData, "paymentMethod");
  const payerName = field(formData, "payerName");
  const senderPhone = field(formData, "senderPhone");
  const transactionReference = field(formData, "transactionReference");
  const notes = field(formData, "notes");
  const proofImage = formData.get("proofImage");

  if (
    !companyId ||
    !packageKey ||
    !paymentMethod ||
    !payerName ||
    !senderPhone ||
    !(proofImage instanceof File) ||
    proofImage.size === 0
  ) {
    redirectToPayment(companyId || "missing", packageKey, "missing");
  }

  const image = proofImage;

  if (!allowedProofTypes.includes(proofImage.type) || proofImage.size > maxProofSize) {
    redirectToPayment(companyId, packageKey, "invalid-proof");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirectToPayment(companyId, packageKey, "not-configured");
  }

  const db = supabase;

  const [{ data: company, error: companyError }, { data: companyPackage, error: packageError }] =
    await Promise.all([
      db
        .from("companies")
        .select("id, company_name, category, city, phone")
        .eq("id", companyId)
        .maybeSingle(),
      db
        .from("company_packages")
        .select("id, package_key, title, price_pkr, duration_days, listings_limit, featured_limit")
        .eq("package_key", packageKey)
        .eq("active", true)
        .maybeSingle(),
    ]);

  if (companyError || packageError || !company || !companyPackage) {
    console.error("Failed to load company payment context", {
      companyError,
      packageError,
    });
    redirectToPayment(companyId, packageKey, "not-found");
  }

  const selectedCompany = company;
  const selectedPackage = companyPackage;

  const { data: payment, error: paymentError } = await db
    .from("manual_payments")
    .insert({
      user_id: randomUUID(),
      company_id: selectedCompany.id,
      package_id: selectedPackage.id,
      package_key: selectedPackage.package_key,
      amount_pkr: selectedPackage.price_pkr,
      payment_method: paymentMethod,
      payer_name: payerName,
      sender_phone: senderPhone,
      transaction_reference: transactionReference || null,
      notes: notes || null,
      status: "pending_review",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    console.error("Failed to save company package payment", paymentError);
    redirectToPayment(companyId, packageKey, "save-error");
  }

  const savedPayment = payment;
  const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `company-packages/${selectedCompany.id}/${savedPayment.id}.${extension}`;

  const { error: uploadError } = await db.storage
    .from("proof-images")
    .upload(filePath, image, {
      cacheControl: "3600",
      contentType: image.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Failed to upload company package proof", uploadError);
    redirectToPayment(companyId, packageKey, "upload-error");
  }

  const { data: publicUrlData } = db.storage
    .from("proof-images")
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;
  const review = await reviewProofWithAi({
    imageUrl,
    expectedAmountPkr: selectedPackage.price_pkr,
  });
  const autoApproved = canAutoApproveProof(review, selectedPackage.price_pkr);

  const { data: proofReview, error: proofError } = await db
    .from("proof_reviews")
    .insert({
      review_type: "company_package",
      related_id: savedPayment.id,
      expected_amount_pkr: selectedPackage.price_pkr,
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

  if (proofError || !proofReview) {
    console.error("Failed to save company package proof review", proofError);
    redirectToPayment(companyId, packageKey, "proof-save-error");
  }

  if (autoApproved) {
    const { startsAt, expiresAt } = packageExpiry(Number(selectedPackage.duration_days));

    const { error: cancelError } = await db
      .from("company_package_subscriptions")
      .update({ status: "cancelled" })
      .eq("company_id", selectedCompany.id)
      .eq("status", "active");

    if (cancelError) {
      console.error("Failed to cancel previous company package", cancelError);
    }

    const { error: subscriptionError } = await db
      .from("company_package_subscriptions")
      .insert({
        company_id: selectedCompany.id,
        package_id: selectedPackage.id,
        manual_payment_id: savedPayment.id,
        package_key: selectedPackage.package_key,
        listings_limit: selectedPackage.listings_limit,
        featured_limit: selectedPackage.featured_limit,
        starts_at: startsAt,
        expires_at: expiresAt,
        status: "active",
      });

    if (subscriptionError) {
      console.error("Failed to auto-activate company package", subscriptionError);
      redirectToPayment(companyId, packageKey, "activation-error");
    }

    const { error: paymentUpdateError } = await db
      .from("manual_payments")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        admin_notes: "Auto-approved by AI proof review.",
      })
      .eq("id", savedPayment.id);

    if (paymentUpdateError) {
      console.error("Failed to mark manual payment approved", paymentUpdateError);
    }

    const { error: companyPaidError } = await db
      .from("companies")
      .update({ payment_status: "paid" })
      .eq("id", selectedCompany.id);

    if (companyPaidError) {
      console.error("Failed to mark company package paid", companyPaidError);
    }

    await recordAdminAudit({
      action: "auto_activate_company_package",
      targetType: "company",
      targetId: selectedCompany.id,
      metadata: {
        packageKey: selectedPackage.package_key,
        paymentId: savedPayment.id as string,
        proofReviewId: proofReview.id as string,
      },
    });

    revalidatePath(`/companies/${selectedCompany.id}/dashboard`);
    revalidatePath(`/companies/${selectedCompany.id}/packages`);
    revalidatePath(`/companies/${selectedCompany.id}/payment`);
    revalidatePath("/admin/payments");
    revalidatePath("/admin/companies");
  } else {
    const { error: companyUpdateError } = await db
      .from("companies")
      .update({ payment_status: "pending_review" })
      .eq("id", selectedCompany.id);

    if (companyUpdateError) {
      console.error("Failed to mark company payment pending", companyUpdateError);
    }
  }

  await sendAdminWhatsappAlert(
    [
      "New company package proof uploaded:",
      `Company: ${selectedCompany.company_name}`,
      `Package: ${selectedPackage.title}`,
      `Expected amount: Rs ${selectedPackage.price_pkr}`,
      `AI decision: ${autoApproved ? "auto_approved" : "needs_review"}`,
      `AI amount: ${review.detectedAmountPkr ? `Rs ${review.detectedAmountPkr}` : "Not detected"}`,
      autoApproved
        ? "Package auto-activated by AI proof review."
        : "Admin: /admin/payments",
    ].join("\n"),
    "company_package_payment",
    savedPayment.id as string,
  );

  redirectToDashboard(companyId, autoApproved ? "package-active" : "payment-under-review");
}
