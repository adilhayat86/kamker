"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canAutoApproveProof, reviewProofWithAi } from "@/lib/ai-proof-review";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import {
  calculateRequirementBroadcastAmountPkr,
  sendRequirementBroadcast,
} from "@/lib/requirement-broadcast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";

const allowedProofTypes = ["image/jpeg", "image/png", "image/webp"];
const maxProofSize = 8 * 1024 * 1024;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToPayment(requirementId: string, status: string): never {
  redirect(`/send-requirement/${requirementId}/payment?status=${status}`);
}

async function getRecipientCount(requirementId: string) {
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("requirement_matches")
    .select("id", { count: "exact", head: true })
    .eq("requirement_id", requirementId);

  if (error) {
    console.error("Failed to count requirement broadcast recipients", error);
    return 0;
  }

  return count ?? 0;
}

export async function submitRequirementBroadcastPayment(formData: FormData) {
  const requirementId = field(formData, "requirementId");
  const paymentMethod = field(formData, "paymentMethod");
  const payerName = field(formData, "payerName");
  const senderPhone = field(formData, "senderPhone");
  const transactionReference = field(formData, "transactionReference");
  const proofImage = formData.get("proofImage");

  if (!requirementId) {
    redirect("/send-requirement?status=error");
  }

  const [professional, customer] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
  ]);

  if (!professional && !customer) {
    redirect(
      `/login?status=login-required&next=${encodeURIComponent(`/send-requirement/${requirementId}/payment`)}`,
    );
  }

  if (
    !paymentMethod ||
    !payerName ||
    !senderPhone ||
    !(proofImage instanceof File) ||
    proofImage.size === 0
  ) {
    redirectToPayment(requirementId, "missing");
  }

  const image = proofImage;

  if (!allowedProofTypes.includes(image.type) || image.size > maxProofSize) {
    redirectToPayment(requirementId, "invalid-proof");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirectToPayment(requirementId, "not-configured");
  }

  const db = supabase;
  const { data: requirement, error: requirementError } = await db
    .from("requirements")
    .select("id, required_service, phone_number, payment_status, broadcast_status")
    .eq("id", requirementId)
    .maybeSingle();

  if (requirementError || !requirement) {
    console.error("Failed to load requirement payment context", requirementError);
    redirectToPayment(requirementId, "not-found");
  }

  const recipientCount = await getRecipientCount(requirementId);
  const expectedAmountPkr = calculateRequirementBroadcastAmountPkr(recipientCount);

  if (expectedAmountPkr <= 0) {
    redirectToPayment(requirementId, "no_matches");
  }

  const { data: payment, error: paymentError } = await db
    .from("requirement_broadcast_payments")
    .insert({
      requirement_id: requirementId,
      amount_pkr: expectedAmountPkr,
      payment_method: paymentMethod,
      payer_name: payerName,
      sender_phone: senderPhone,
      transaction_reference: transactionReference || null,
      status: "pending_review",
      broadcast_status: "pending_payment",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    console.error("Failed to save requirement broadcast payment", paymentError);
    redirectToPayment(requirementId, "save-error");
  }

  const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `requirement-broadcasts/${requirementId}/${payment.id}.${extension}`;

  const { error: uploadError } = await db.storage
    .from("proof-images")
    .upload(filePath, image, {
      cacheControl: "3600",
      contentType: image.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    console.error("Failed to upload requirement proof", uploadError);
    redirectToPayment(requirementId, "upload-error");
  }

  const { data: publicUrlData } = db.storage
    .from("proof-images")
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;
  const review = await reviewProofWithAi({
    imageUrl,
    expectedAmountPkr,
  });
  const autoApproved = canAutoApproveProof(review, expectedAmountPkr);

  const { data: proofReview, error: proofError } = await db
    .from("proof_reviews")
    .insert({
      review_type: "requirement_broadcast",
      related_id: payment.id,
      expected_amount_pkr: expectedAmountPkr,
      image_url: imageUrl,
      ai_readable: review.readable,
      ai_detected_amount_pkr: review.detectedAmountPkr,
      ai_detected_reference: review.detectedReference,
      ai_detected_method: review.detectedMethod,
      ai_detected_date: review.detectedDate,
      ai_confidence: review.confidence,
      ai_decision: autoApproved ? "auto_approved" : "needs_review",
      ai_notes: `Requirement broadcast. ${review.notes}`,
      audit_status: autoApproved ? "auto_approved" : "unchecked",
    })
    .select("id")
    .single();

  if (proofError || !proofReview) {
    console.error("Failed to save requirement proof review", proofError);
    redirectToPayment(requirementId, "proof-save-error");
  }

  await db
    .from("requirement_broadcast_payments")
    .update({
      proof_review_id: proofReview.id,
      proof_image_url: imageUrl,
      ai_decision: autoApproved ? "auto_approved" : "needs_review",
      ai_detected_amount_pkr: review.detectedAmountPkr,
      ai_confidence: review.confidence,
    })
    .eq("id", payment.id);

  if (!autoApproved) {
    await db
      .from("requirements")
      .update({
        payment_status: "pending_review",
        broadcast_status: "pending_payment",
      })
      .eq("id", requirementId);

    await sendAdminWhatsappAlert(
      [
        "Requirement payment proof uploaded:",
        `Service: ${requirement.required_service}`,
        `Recipients: ${recipientCount}`,
        `Expected amount: Rs ${expectedAmountPkr}`,
        "AI decision: needs_review",
        "Admin: /admin/payments",
      ].join("\n"),
      "requirement_payment",
      payment.id as string,
    );

    revalidatePath(`/send-requirement/${requirementId}/payment`);
    revalidatePath("/admin/payments");
    redirectToPayment(requirementId, "needs_review");
  }

  await db
    .from("requirements")
    .update({ payment_status: "paid", broadcast_status: "paid" })
    .eq("id", requirementId);

  const broadcastResult = await sendRequirementBroadcast(requirementId);
  await db
    .from("requirement_broadcast_payments")
    .update({
      status: "approved",
      broadcast_status: broadcastResult.status,
      reviewed_at: new Date().toISOString(),
      admin_notes: "Auto-approved by AI proof review.",
    })
    .eq("id", payment.id);

  await sendAdminWhatsappAlert(
    [
      "Requirement payment auto-approved:",
      `Service: ${requirement.required_service}`,
      `Recipients: ${recipientCount}`,
      `Expected amount: Rs ${expectedAmountPkr}`,
      `Broadcast status: ${broadcastResult.status}`,
      `Sent: ${broadcastResult.sent}`,
      `Failed: ${broadcastResult.failed}`,
    ].join("\n"),
    "requirement_payment",
    payment.id as string,
  );

  revalidatePath(`/send-requirement/${requirementId}/payment`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/requirements");
  redirectToPayment(requirementId, broadcastResult.status);
}
