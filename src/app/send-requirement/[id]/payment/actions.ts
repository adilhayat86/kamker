"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canAutoApproveProof, reviewProofWithAi } from "@/lib/ai-proof-review";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import {
  calculateRequirementBroadcastAmountPkr,
  notifyRequirementSender,
  sendRequirementBroadcast,
} from "@/lib/requirement-broadcast";
import { createRequirementMatches } from "@/lib/requirement-matching";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  isRequirementWhatsappConfigured,
  isWhatsappConfigured,
  sendAdminWhatsappAlert,
} from "@/lib/whatsapp";

const allowedProofTypes = ["image/jpeg", "image/png", "image/webp"];
const maxProofSize = 8 * 1024 * 1024;

type RequirementPaymentContext = {
  id: string;
  required_service: string;
  area: string | null;
  phone_number: string;
  payment_status: string;
  broadcast_status: string;
  cities: { name: string } | null;
};

type RequirementBroadcastPayment = {
  id: string;
  requirement_id: string;
  amount_pkr: number;
  status: string;
  broadcast_status: string;
  proof_image_url: string | null;
  proof_review_id: string | null;
};

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToPayment(requirementId: string, status: string): never {
  redirect(`/send-requirement/${requirementId}/payment?status=${status}`);
}

async function requireLoggedIn(requirementId: string) {
  const [professional, customer] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
  ]);

  if (!professional && !customer) {
    redirect(
      `/login?status=login-required&next=${encodeURIComponent(`/send-requirement/${requirementId}/payment`)}`,
    );
  }
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

async function getOrCreateRecipientCount(requirement: RequirementPaymentContext) {
  const currentCount = await getRecipientCount(requirement.id);

  if (currentCount > 0) {
    return currentCount;
  }

  await createRequirementMatches({
    id: requirement.id,
    requiredService: requirement.required_service,
    cityName: requirement.cities?.name ?? null,
    area: requirement.area,
    availability: null,
  });

  return getRecipientCount(requirement.id);
}

async function loadRequirement(requirementId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("id, required_service, area, phone_number, payment_status, broadcast_status, cities(name)")
    .eq("id", requirementId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load requirement payment context", error);
    return null;
  }

  return data as RequirementPaymentContext | null;
}

async function loadLatestPayment(requirementId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("requirement_broadcast_payments")
    .select("id, requirement_id, amount_pkr, status, broadcast_status, proof_image_url, proof_review_id")
    .eq("requirement_id", requirementId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load requirement broadcast payment", error);
    return null;
  }

  return data as RequirementBroadcastPayment | null;
}

function revalidateRequirementPayment(requirementId: string) {
  revalidatePath(`/send-requirement/${requirementId}/payment`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/requirements");
  revalidatePath(`/admin/requirements/${requirementId}`);
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

  await requireLoggedIn(requirementId);

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

  if (!isWhatsappConfigured() || !isRequirementWhatsappConfigured()) {
    redirectToPayment(requirementId, "whatsapp-not-configured");
  }

  const db = supabase;
  const [requirement, existingPayment] = await Promise.all([
    loadRequirement(requirementId),
    loadLatestPayment(requirementId),
  ]);

  if (!requirement) {
    redirectToPayment(requirementId, "not-found");
  }

  const recipientCount = await getOrCreateRecipientCount(requirement);

  if (requirement.payment_status === "paid") {
    redirectToPayment(requirementId, "verified");
  }

  if (existingPayment?.proof_image_url) {
    redirectToPayment(requirementId, "receipt-uploaded");
  }

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

  await db
    .from("requirement_broadcast_payments")
    .update({
      proof_image_url: publicUrlData.publicUrl,
      broadcast_status: "pending_payment",
    })
    .eq("id", payment.id);

  await db
    .from("requirements")
    .update({
      payment_status: "pending_review",
      broadcast_status: "pending_payment",
    })
    .eq("id", requirementId);

  await sendAdminWhatsappAlert(
    [
      "Requirement receipt uploaded:",
      `Service: ${requirement.required_service}`,
      `Recipients: ${recipientCount}`,
      `Expected amount: Rs ${expectedAmountPkr}`,
      "Customer can verify receipt on payment page.",
    ].join("\n"),
    "requirement_payment",
    payment.id as string,
  );

  revalidateRequirementPayment(requirementId);
  redirectToPayment(requirementId, "receipt-uploaded");
}

export async function verifyRequirementReceipt(formData: FormData) {
  const requirementId = field(formData, "requirementId");

  if (!requirementId) {
    redirect("/send-requirement?status=error");
  }

  await requireLoggedIn(requirementId);

  if (!isSupabaseConfigured || !supabase) {
    redirectToPayment(requirementId, "not-configured");
  }

  const db = supabase;
  const [requirement, payment] = await Promise.all([
    loadRequirement(requirementId),
    loadLatestPayment(requirementId),
  ]);

  if (!requirement) {
    redirectToPayment(requirementId, "not-found");
  }

  if (requirement.payment_status === "paid") {
    redirectToPayment(requirementId, "verified");
  }

  if (!payment?.proof_image_url) {
    redirectToPayment(requirementId, "missing-proof");
  }

  const recipientCount = await getOrCreateRecipientCount(requirement);

  const expectedAmountPkr =
    payment.amount_pkr || calculateRequirementBroadcastAmountPkr(recipientCount);

  if (expectedAmountPkr <= 0) {
    redirectToPayment(requirementId, "no_matches");
  }

  const review = await reviewProofWithAi({
    imageUrl: payment.proof_image_url,
    expectedAmountPkr,
  });
  const autoApproved = canAutoApproveProof(review, expectedAmountPkr);

  const { data: proofReview, error: proofError } = await db
    .from("proof_reviews")
    .insert({
      review_type: "requirement_broadcast",
      related_id: payment.id,
      expected_amount_pkr: expectedAmountPkr,
      image_url: payment.proof_image_url,
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
      ai_decision: autoApproved ? "auto_approved" : "needs_review",
      ai_detected_amount_pkr: review.detectedAmountPkr,
      ai_confidence: review.confidence,
      status: autoApproved ? "approved" : "pending_review",
      broadcast_status: autoApproved ? "ready_to_send" : "pending_payment",
      reviewed_at: autoApproved ? new Date().toISOString() : null,
      admin_notes: autoApproved
        ? "Auto-approved by AI proof review."
        : "AI could not verify receipt. Admin review required.",
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
        "Requirement payment proof needs review:",
        `Service: ${requirement.required_service}`,
        `Recipients: ${recipientCount}`,
        `Expected amount: Rs ${expectedAmountPkr}`,
        "Admin: /admin/payments",
      ].join("\n"),
      "requirement_payment",
      payment.id,
    );

    revalidateRequirementPayment(requirementId);
    redirectToPayment(requirementId, "verification-needs-review");
  }

  await db
    .from("requirements")
    .update({
      payment_status: "paid",
      broadcast_status: "ready_to_send",
    })
    .eq("id", requirementId);

  await sendAdminWhatsappAlert(
    [
      "Requirement payment verified:",
      `Service: ${requirement.required_service}`,
      `Recipients: ${recipientCount}`,
      `Expected amount: Rs ${expectedAmountPkr}`,
      "Customer can now send broadcast.",
    ].join("\n"),
    "requirement_payment",
    payment.id,
  );

  revalidateRequirementPayment(requirementId);
  redirectToPayment(requirementId, "verified");
}

export async function sendVerifiedRequirementBroadcast(formData: FormData) {
  const requirementId = field(formData, "requirementId");

  if (!requirementId) {
    redirect("/send-requirement?status=error");
  }

  await requireLoggedIn(requirementId);

  if (!isSupabaseConfigured || !supabase) {
    redirectToPayment(requirementId, "not-configured");
  }

  if (!isWhatsappConfigured() || !isRequirementWhatsappConfigured()) {
    redirectToPayment(requirementId, "whatsapp-not-configured");
  }

  const [requirement, latestPayment] = await Promise.all([
    loadRequirement(requirementId),
    loadLatestPayment(requirementId),
  ]);

  if (!requirement) {
    redirectToPayment(requirementId, "not-found");
  }

  if (
    requirement.payment_status !== "paid" ||
    !["ready_to_send", "paid"].includes(requirement.broadcast_status)
  ) {
    redirectToPayment(requirementId, "not-ready");
  }

  const broadcastResult = await sendRequirementBroadcast(requirementId);

  if (latestPayment) {
    await supabase
      .from("requirement_broadcast_payments")
      .update({
        status: "approved",
        broadcast_status: broadcastResult.status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", latestPayment.id);
  }

  await notifyRequirementSender(requirementId, broadcastResult);

  await sendAdminWhatsappAlert(
    [
      "Requirement broadcast completed:",
      `Service: ${requirement.required_service}`,
      `Broadcast status: ${broadcastResult.status}`,
      `Sent: ${broadcastResult.sent}`,
      `Failed: ${broadcastResult.failed}`,
      `Skipped: ${broadcastResult.skipped}`,
    ].join("\n"),
    "requirement_payment",
    latestPayment?.id,
  );

  revalidateRequirementPayment(requirementId);
  redirectToPayment(requirementId, broadcastResult.status);
}
