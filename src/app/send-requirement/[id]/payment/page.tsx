import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  MessageCircle,
  ReceiptText,
  Send,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { getPaymentWhatsappLink, manualPaymentConfig } from "@/lib/payment-config";
import {
  calculateRequirementBroadcastAmountPkr,
  REQUIREMENT_BROADCAST_AMOUNT_PKR,
} from "@/lib/requirement-broadcast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  isRequirementWhatsappConfigured,
  isWhatsappConfigured,
} from "@/lib/whatsapp";

import {
  sendVerifiedRequirementBroadcast,
  submitRequirementBroadcastPayment,
  verifyRequirementReceipt,
} from "./actions";

export const metadata = {
  title: "Requirement Payment | Kamker",
  description: "Upload payment proof for a Kamker requirement broadcast.",
};

export const dynamic = "force-dynamic";

type RequirementPaymentPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    status?:
      | "missing"
      | "invalid-proof"
      | "not-configured"
      | "not-found"
      | "save-error"
      | "upload-error"
      | "proof-save-error"
      | "receipt-uploaded"
      | "verified"
      | "verification-needs-review"
      | "missing-proof"
      | "not-ready"
      | "needs_review"
      | "sent"
      | "partial"
      | "failed"
      | "no_matches"
      | "whatsapp-not-configured";
  }>;
};

type Requirement = {
  id: string;
  required_service: string;
  area: string | null;
  details: string;
  phone_number: string;
  whatsapp_number: string | null;
  payment_status: string;
  broadcast_status: string;
  cities: { name: string } | null;
};

type RequirementBroadcastPayment = {
  id: string;
  amount_pkr: number;
  status: string;
  broadcast_status: string;
  proof_image_url: string | null;
  ai_decision: string | null;
  ai_detected_amount_pkr: number | null;
  ai_confidence: number | null;
  reviewed_at: string | null;
  created_at: string;
};

type WhatsappLog = {
  id: string;
  recipient_phone: string;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

const statusMessages = {
  missing: "Add payment details and upload a receipt screenshot before submitting.",
  "invalid-proof": "Upload a jpg, png, or webp receipt screenshot under 8MB.",
  "not-configured": "Supabase is not configured, so payment proof cannot be saved yet.",
  "not-found": "Requirement details were not found.",
  "save-error": "Could not save the requirement payment record. Please try again.",
  "upload-error": "Could not upload the receipt image. Please try again.",
  "proof-save-error": "Receipt uploaded, but AI proof review could not be saved. Kamker admin should review manually.",
  "receipt-uploaded": "Receipt uploaded. Click Verify Receipt to check it before sending messages.",
  verified: "Receipt verified. You can now send the broadcast.",
  "verification-needs-review": "Receipt needs admin review. Your requirement will be sent within 3 hours after admin approval.",
  "missing-proof": "Upload a receipt before verifying payment.",
  "not-ready": "Broadcast is not ready yet. Verify payment first.",
  needs_review: "Receipt uploaded. Broadcast will start after payment proof review.",
  sent: "Payment approved. Matching professionals have been messaged.",
  partial: "Payment approved. Some professionals were messaged, but a few sends failed.",
  failed: "Payment approved, but WhatsApp sending failed. Kamker admin can retry from the requirement detail.",
  no_matches: "No matching professionals are available for this requirement yet. Do not pay until matches are available.",
  "whatsapp-not-configured": "WhatsApp broadcast setup is not ready. Do not pay until Kamker fixes this.",
} as const;

function formatPrice(value: number) {
  return `Rs ${value.toLocaleString("en-PK")}`;
}

async function getRequirement(id: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("id, required_service, area, details, phone_number, whatsapp_number, payment_status, broadcast_status, cities(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load requirement payment page", error);
    return null;
  }

  return data as unknown as Requirement | null;
}

async function getRecipientCount(requirementId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { count, error } = await supabase
    .from("requirement_matches")
    .select("id", { count: "exact", head: true })
    .eq("requirement_id", requirementId);

  if (error) {
    console.error("Failed to load requirement recipient count", error);
    return null;
  }

  return count ?? 0;
}

async function getLatestPayment(requirementId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("requirement_broadcast_payments")
    .select(
      "id, amount_pkr, status, broadcast_status, proof_image_url, ai_decision, ai_detected_amount_pkr, ai_confidence, reviewed_at, created_at",
    )
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

async function getWhatsappLogs(requirementId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as WhatsappLog[];
  }

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("id, recipient_phone, status, provider_message_id, error_message, sent_at, created_at")
    .eq("related_type", "requirement_broadcast")
    .eq("related_id", requirementId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load requirement WhatsApp logs", error);
    return [] as WhatsappLog[];
  }

  return (data ?? []) as WhatsappLog[];
}

export default async function RequirementPaymentPage({
  params,
  searchParams,
}: RequirementPaymentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const [
    professional,
    customer,
    requirement,
    recipientCount,
    latestPayment,
    whatsappLogs,
  ] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
    getRequirement(id),
    getRecipientCount(id),
    getLatestPayment(id),
    getWhatsappLogs(id),
  ]);

  if (!professional && !customer) {
    redirect(
      `/login?status=login-required&next=${encodeURIComponent(`/send-requirement/${id}/payment`)}`,
    );
  }

  const statusMessage = query?.status ? statusMessages[query.status] : null;
  const payableRecipientCount = recipientCount ?? 0;
  const payableAmount = calculateRequirementBroadcastAmountPkr(payableRecipientCount);
  const payableAmountLabel =
    recipientCount === null ? "Calculated after matching" : formatPrice(payableAmount);
  const message = requirement
    ? `Hello Kamker, I paid ${payableAmountLabel} for requirement broadcast. Service: ${requirement.required_service}. Requirement ID: ${requirement.id}`
    : `Hello Kamker, I want to pay for requirement broadcast.`;
  const isCompleted =
    requirement?.payment_status === "paid" &&
    ["sent", "partial", "failed", "no_matches"].includes(requirement.broadcast_status);
  const isPaymentApproved = requirement?.payment_status === "paid";
  const hasReceipt = Boolean(latestPayment?.proof_image_url);
  const needsAdminReview = Boolean(
    latestPayment?.ai_decision === "needs_review" ||
      query?.status === "needs_review" ||
      query?.status === "verification-needs-review" ||
      query?.status === "proof-save-error",
  );
  const isReceiptUploaded = Boolean(hasReceipt && !needsAdminReview && !isPaymentApproved);
  const isProofUnderReview = needsAdminReview;
  const canVerifyReceipt = Boolean(hasReceipt && !isPaymentApproved && !needsAdminReview);
  const isReadyToSend = Boolean(
    requirement?.payment_status === "paid" &&
      ["ready_to_send", "paid"].includes(requirement.broadcast_status),
  );
  const isPaymentLocked = hasReceipt || isPaymentApproved;
  const whatsappReady = isWhatsappConfigured() && isRequirementWhatsappConfigured();
  const canUploadProof = Boolean(
    requirement && payableAmount > 0 && !isPaymentLocked && !isCompleted && whatsappReady,
  );
  const sentLogs = whatsappLogs.filter((log) => log.status === "sent");
  const failedLogs = whatsappLogs.filter((log) => log.status === "failed");
  const skippedLogs = whatsappLogs.filter((log) => log.status === "skipped");
  const reportHref = `/send-requirement/${id}/broadcast-report-view`;
  const heading = isCompleted
    ? "Broadcast report"
    : isProofUnderReview
    ? "Receipt received"
    : isReadyToSend
      ? "Ready to send"
      : isReceiptUploaded
        ? "Verify receipt"
      : isPaymentApproved
        ? "Payment processed"
      : "Upload payment proof";
  const intro = isCompleted
    ? "Review the delivery result and download a CSV report for your records."
    : isProofUnderReview
    ? "Your receipt is saved. If automatic verification cannot confirm it, Kamker will send the requirement within 3 hours after admin review."
    : isReadyToSend
      ? "Payment is verified. Click Send Broadcast to message all matched professionals now."
      : isReceiptUploaded
        ? "Your receipt is uploaded. Verify it now so the broadcast can be unlocked."
      : isPaymentApproved
        ? "Payment has been approved. Kamker is handling the WhatsApp broadcast status below."
      : `Pay ${payableAmountLabel} and upload the receipt. Clear matching receipts can approve automatically and send WhatsApp messages to matching professionals.`;
  const completionTitle =
    requirement?.broadcast_status === "sent"
      ? "Messages sent successfully"
      : requirement?.broadcast_status === "partial"
        ? "Messages partly sent"
        : requirement?.broadcast_status === "no_matches"
          ? "No matching recipients"
          : "Broadcast needs admin retry";
  const completionDescription =
    requirement?.broadcast_status === "sent"
      ? "All matched professionals were contacted."
      : requirement?.broadcast_status === "partial"
        ? "Some professionals were contacted. Failed rows are included in the CSV report."
        : requirement?.broadcast_status === "no_matches"
          ? "No valid WhatsApp recipients were available for this requirement."
          : "No messages were sent successfully. Kamker admin can inspect the failed rows and retry.";

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation backHref="/send-requirement" backLabel="Requirement" />

        <div className="mt-5">
          <Badge variant="secondary" className="gap-1.5">
            <ReceiptText className="size-3.5" aria-hidden="true" />
            Paid requirement broadcast
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">{heading}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {intro}
          </p>
        </div>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close payment message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Badge variant={hasReceipt ? "default" : "secondary"}>Step 1</Badge>
              {hasReceipt ? <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" /> : null}
            </div>
            <h2 className="mt-3 text-sm font-bold">Upload Receipt</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {hasReceipt
                ? "Receipt saved. No need to upload again."
                : "Upload EasyPaisa receipt screenshot after payment."}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Badge variant={isReadyToSend || isCompleted ? "default" : "secondary"}>Step 2</Badge>
              {isReadyToSend || isCompleted ? (
                <ShieldCheck className="size-5 text-emerald-600" aria-hidden="true" />
              ) : isProofUnderReview ? (
                <Clock3 className="size-5 text-sky-700" aria-hidden="true" />
              ) : null}
            </div>
            <h2 className="mt-3 text-sm font-bold">Verify Receipt</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isReadyToSend || isCompleted
                ? "Payment is verified."
                : isProofUnderReview
                  ? "Admin review is needed before sending."
                  : hasReceipt
                    ? "Click Verify Receipt to unlock broadcast."
                    : "Available after receipt upload."}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Badge variant={isCompleted ? "default" : "secondary"}>Step 3</Badge>
              {isCompleted ? (
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
              ) : isReadyToSend ? (
                <Send className="size-5 text-primary" aria-hidden="true" />
              ) : null}
            </div>
            <h2 className="mt-3 text-sm font-bold">Send Broadcast</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {isCompleted
                ? "Delivery report is ready."
                : isReadyToSend
                  ? "Click Send Broadcast to message recipients."
                  : "Broadcast stays locked until payment approval."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-xl font-bold">Requirement</h2>
              {requirement ? (
                <>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-semibold">{requirement.required_service}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">City</span>
                      <span className="font-semibold">{requirement.cities?.name ?? "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Area</span>
                      <span className="font-semibold">{requirement.area ?? "Any area"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Payment</span>
                      <span className="font-semibold">{requirement.payment_status}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Broadcast</span>
                      <span className="font-semibold">{requirement.broadcast_status}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Recipients</span>
                      <span className="font-semibold">
                        {recipientCount === null
                          ? "Checking"
                          : `${recipientCount.toLocaleString("en-PK")} matched`}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 rounded-lg border bg-slate-50 p-3 text-sm leading-6 text-muted-foreground">
                    {requirement.details}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Requirement not found or Supabase is not configured.
                </p>
              )}

              <Button asChild className="mt-6 h-12 w-full bg-[#25d366] text-white hover:bg-[#21bd5b]">
                <a href={getPaymentWhatsappLink(message)}>
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Ask Kamker on WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="rounded-xl border border-primary/20 bg-blue-50 p-4 text-sm">
                <p className="font-semibold text-foreground">Pay to Kamker</p>
                <dl className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Method</dt>
                    <dd className="font-semibold">{manualPaymentConfig.bankName}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Account title</dt>
                    <dd className="font-semibold">{manualPaymentConfig.accountTitle}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Account number</dt>
                    <dd className="font-semibold tracking-wide">{manualPaymentConfig.accountNumber}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Rate</dt>
                    <dd className="font-semibold">
                      {formatPrice(REQUIREMENT_BROADCAST_AMOUNT_PKR)} / recipient
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">Recipients</dt>
                    <dd className="font-semibold">
                      {recipientCount === null ? "Checking" : recipientCount.toLocaleString("en-PK")}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-white px-3 py-2">
                    <dt className="text-muted-foreground">Total amount</dt>
                    <dd className="mt-1 text-lg font-bold text-primary">
                      {recipientCount === null
                        ? "Calculated after matching"
                        : `${formatPrice(REQUIREMENT_BROADCAST_AMOUNT_PKR)} x ${recipientCount.toLocaleString("en-PK")} = ${formatPrice(payableAmount)}`}
                    </dd>
                  </div>
                </dl>
              </div>

              {isCompleted ? (
                <div
                  className={`mt-5 rounded-lg border p-4 text-sm ${
                    requirement?.broadcast_status === "failed"
                      ? "border-red-200 bg-red-50 text-red-950"
                      : requirement?.broadcast_status === "partial"
                        ? "border-amber-200 bg-amber-50 text-amber-950"
                        : "border-emerald-200 bg-emerald-50 text-emerald-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {requirement?.broadcast_status === "failed" ? (
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{completionTitle}</p>
                      <p className="mt-1">{completionDescription}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-white px-2 py-3">
                          <p className="text-muted-foreground">Sent</p>
                          <p className="mt-1 text-lg font-bold text-emerald-700">
                            {sentLogs.length}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white px-2 py-3">
                          <p className="text-muted-foreground">Failed</p>
                          <p className="mt-1 text-lg font-bold text-red-700">
                            {failedLogs.length}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white px-2 py-3">
                          <p className="text-muted-foreground">Skipped</p>
                          <p className="mt-1 text-lg font-bold text-slate-700">
                            {skippedLogs.length}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="mt-4 h-11 w-full">
                        <a href={reportHref}>
                          <Download className="size-4" aria-hidden="true" />
                          View Delivery Report
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : isReadyToSend ? (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">Receipt verified</p>
                      <p className="mt-1">
                        Your payment is approved. Click the button below to send
                        WhatsApp messages to all matched professionals.
                      </p>
                      <form action={sendVerifiedRequirementBroadcast} className="mt-4">
                        <input type="hidden" name="requirementId" value={id} />
                        <Button className="h-12 w-full">
                          <Send className="size-4" aria-hidden="true" />
                          Send Broadcast
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : canVerifyReceipt ? (
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                  <div className="flex items-start gap-3">
                    <ReceiptText className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">Receipt uploaded</p>
                      <p className="mt-1">
                        Verify this receipt now. If it passes, the Send Broadcast
                        button will unlock immediately.
                      </p>
                      {latestPayment?.proof_image_url ? (
                        <Button asChild variant="outline" className="mt-3 h-10 w-full bg-white">
                          <a href={latestPayment.proof_image_url} target="_blank" rel="noreferrer">
                            View uploaded receipt
                          </a>
                        </Button>
                      ) : null}
                      <form action={verifyRequirementReceipt} className="mt-3">
                        <input type="hidden" name="requirementId" value={id} />
                        <Button className="h-12 w-full">
                          <ShieldCheck className="size-4" aria-hidden="true" />
                          Verify Receipt
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : isProofUnderReview ? (
                <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">Receipt needs admin review</p>
                      <p className="mt-1">
                        Your requirement is saved. It will be sent within 3
                        hours after admin approval. No broadcast has been sent yet.
                      </p>
                      {latestPayment?.proof_image_url ? (
                        <Button asChild variant="outline" className="mt-3 h-10 w-full bg-white">
                          <a href={latestPayment.proof_image_url} target="_blank" rel="noreferrer">
                            View uploaded receipt
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : isPaymentApproved ? (
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">Payment approved</p>
                      <p className="mt-1">
                        Broadcast status is{" "}
                        <span className="font-semibold">{requirement?.broadcast_status}</span>.
                        Refresh this page if the result has not appeared yet.
                      </p>
                    </div>
                  </div>
                </div>
              ) : !whatsappReady ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
                  WhatsApp broadcast is not ready right now. Do not pay yet.
                  Kamker must have the WhatsApp token, phone number ID, template
                  name, and template language configured before messages can be sent.
                </div>
              ) : !canUploadProof ? (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  No payable recipient list is available yet. Do not upload a
                  receipt until Kamker shows a matched-recipient count above.
                </div>
              ) : (
                <form action={submitRequirementBroadcastPayment} className="mt-5 grid gap-4">
                  <input type="hidden" name="requirementId" value={id} />

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Payment method</span>
                    <select
                      name="paymentMethod"
                      required
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      defaultValue="EasyPaisa"
                    >
                      <option>EasyPaisa</option>
                      <option>JazzCash</option>
                      <option>Bank Transfer</option>
                      <option>Raast</option>
                      <option>Other</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Payer name</span>
                    <input
                      name="payerName"
                      required
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Name used for payment"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Sender phone</span>
                    <input
                      name="senderPhone"
                      required
                      inputMode="tel"
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Payment sender number"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Transaction reference</span>
                    <input
                      name="transactionReference"
                      className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Optional transaction ID"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium">Receipt screenshot</span>
                    <input
                      name="proofImage"
                      type="file"
                      required
                      accept="image/jpeg,image/png,image/webp"
                      className="rounded-md border border-dashed border-input bg-background px-3 py-3 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                    />
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG, or WebP. Maximum 8MB.
                    </span>
                  </label>

                  <Button className="h-12 w-full">
                    <UploadCloud className="size-4" aria-hidden="true" />
                    Upload Receipt
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/categories">Browse Categories</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
