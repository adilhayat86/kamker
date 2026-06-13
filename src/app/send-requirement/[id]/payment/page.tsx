import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, ReceiptText, UploadCloud } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { getPaymentWhatsappLink, manualPaymentConfig } from "@/lib/payment-config";
import { REQUIREMENT_BROADCAST_AMOUNT_PKR } from "@/lib/requirement-broadcast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { submitRequirementBroadcastPayment } from "./actions";

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
      | "needs_review"
      | "sent"
      | "partial"
      | "failed"
      | "no_matches";
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

const statusMessages = {
  missing: "Add payment details and upload a receipt screenshot before submitting.",
  "invalid-proof": "Upload a jpg, png, or webp receipt screenshot under 8MB.",
  "not-configured": "Supabase is not configured, so payment proof cannot be saved yet.",
  "not-found": "Requirement details were not found.",
  "save-error": "Could not save the requirement payment record. Please try again.",
  "upload-error": "Could not upload the receipt image. Please try again.",
  "proof-save-error": "Receipt uploaded, but AI proof review could not be saved. Kamker admin should review manually.",
  needs_review: "Receipt uploaded. Broadcast will start after payment proof review.",
  sent: "Payment approved. Matching professionals have been messaged.",
  partial: "Payment approved. Some professionals were messaged, but a few sends failed.",
  failed: "Payment approved, but WhatsApp sending failed. Kamker admin can retry from the requirement detail.",
  no_matches: "Payment approved, but no matching professionals were available yet. Kamker admin can follow up.",
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

export default async function RequirementPaymentPage({
  params,
  searchParams,
}: RequirementPaymentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const [professional, customer, requirement] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
    getRequirement(id),
  ]);

  if (!professional && !customer) {
    redirect(
      `/login?status=login-required&next=${encodeURIComponent(`/send-requirement/${id}/payment`)}`,
    );
  }

  const statusMessage = query?.status ? statusMessages[query.status] : null;
  const message = requirement
    ? `Hello Kamker, I paid ${formatPrice(REQUIREMENT_BROADCAST_AMOUNT_PKR)} for requirement broadcast. Service: ${requirement.required_service}. Requirement ID: ${requirement.id}`
    : `Hello Kamker, I want to pay ${formatPrice(REQUIREMENT_BROADCAST_AMOUNT_PKR)} for requirement broadcast.`;
  const isCompleted =
    requirement?.payment_status === "paid" &&
    ["sent", "partial", "no_matches"].includes(requirement.broadcast_status);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation backHref="/send-requirement" backLabel="Requirement" />

        <div className="mt-5">
          <Badge variant="secondary" className="gap-1.5">
            <ReceiptText className="size-3.5" aria-hidden="true" />
            Paid requirement broadcast
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">
            Upload payment proof
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Pay {formatPrice(REQUIREMENT_BROADCAST_AMOUNT_PKR)} and upload the
            receipt. Clear matching receipts can approve automatically and send
            WhatsApp messages to matching professionals.
          </p>
        </div>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close payment message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

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
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-semibold">{formatPrice(REQUIREMENT_BROADCAST_AMOUNT_PKR)}</dd>
                  </div>
                </dl>
              </div>

              {isCompleted ? (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  This requirement is already paid. Broadcast status:{" "}
                  <span className="font-semibold">{requirement?.broadcast_status}</span>.
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
