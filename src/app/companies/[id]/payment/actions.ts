"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { reviewProofWithAi } from "@/lib/ai-proof-review";
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
        .select("id, package_key, title, price_pkr")
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
      ai_decision: review.decision,
      ai_notes: review.notes,
      audit_status: "unchecked",
    })
    .select("id")
    .single();

  if (proofError || !proofReview) {
    console.error("Failed to save company package proof review", proofError);
    redirectToPayment(companyId, packageKey, "proof-save-error");
  }

  const { error: companyUpdateError } = await db
    .from("companies")
    .update({ payment_status: "pending_review" })
    .eq("id", selectedCompany.id);

  if (companyUpdateError) {
    console.error("Failed to mark company payment pending", companyUpdateError);
  }

  await sendAdminWhatsappAlert(
    [
      "New company package proof uploaded:",
      `Company: ${selectedCompany.company_name}`,
      `Package: ${selectedPackage.title}`,
      `Expected amount: Rs ${selectedPackage.price_pkr}`,
      `AI decision: ${review.decision}`,
      `AI amount: ${review.detectedAmountPkr ? `Rs ${review.detectedAmountPkr}` : "Not detected"}`,
      "Admin: /admin/payments",
    ].join("\n"),
    "company_package_payment",
    savedPayment.id as string,
  );

  redirectToPayment(companyId, packageKey, review.decision);
}
