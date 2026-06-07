import Link from "next/link";
import { MessageCircle, ReceiptText, ShieldCheck, UploadCloud } from "lucide-react";
import { redirect } from "next/navigation";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { submitCompanyPackagePayment } from "./actions";

export const metadata = {
  title: "Activate Company Package | Kamker",
  description: "Upload payment proof to activate a Kamker company professional package.",
};

type Company = {
  id: string;
  company_name: string;
  category: string;
  city: string;
  payment_status: string;
};

type CompanyPackage = {
  package_key: string;
  title: string;
  price_pkr: number;
  duration_days: number;
  listings_limit: number;
  featured_limit: number;
};

type CompanyPaymentPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    package?: string;
    status?:
      | "missing"
      | "invalid-proof"
      | "not-configured"
      | "not-found"
      | "save-error"
      | "upload-error"
      | "proof-save-error"
      | "activation-error"
      | "auto_approved"
      | "needs_review";
  }>;
};

const supportWhatsappNumber = process.env.NEXT_PUBLIC_KAMKER_SUPPORT_WHATSAPP || "923000000000";

function formatPrice(value: number) {
  return `Rs ${value.toLocaleString("en-PK")}`;
}

function whatsappLink(message: string) {
  const cleanNumber = supportWhatsappNumber.replace(/\D/g, "");

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

const statusMessages = {
  missing: "Add payment details and upload a receipt screenshot before submitting.",
  "invalid-proof": "Upload a jpg, png, or webp receipt screenshot under 3MB.",
  "not-configured": "Supabase is not configured, so payment proof cannot be saved yet.",
  "not-found": "Company or package details were not found. Please choose the package again.",
  "save-error": "Could not save the manual payment record. Please try again.",
  "upload-error": "Could not upload the receipt image. Please try again.",
  "proof-save-error": "Receipt uploaded, but AI proof review could not be saved. Kamker admin should review manually.",
  "activation-error": "Receipt was approved by AI, but package activation failed. Kamker admin should review this payment.",
  auto_approved: "Receipt approved by AI. Your company package is active and you can add staff profiles now.",
  needs_review: "Receipt uploaded. AI could not safely verify it, so Kamker admin will review it.",
} as const;

async function getCompany(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, category, city, payment_status")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company", error);
    return null;
  }

  return data as Company | null;
}

async function getCompanyPackage(packageKey: string) {
  if (!isSupabaseConfigured || !supabase || !packageKey) {
    return null;
  }

  const { data, error } = await supabase
    .from("company_packages")
    .select("package_key, title, price_pkr, duration_days, listings_limit, featured_limit")
    .eq("package_key", packageKey)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company package", error);
    return null;
  }

  return data as CompanyPackage | null;
}

export default async function CompanyPaymentPage({
  params,
  searchParams,
}: CompanyPaymentPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const packageKey = query?.package ?? "";

  if (query?.status === "auto_approved") {
    redirect(`/companies/${id}/dashboard?status=package-active`);
  }

  if (query?.status === "needs_review") {
    redirect(`/companies/${id}/dashboard?status=payment-under-review`);
  }

  const statusMessage = query?.status ? statusMessages[query.status] : null;
  const [company, companyPackage] = await Promise.all([
    getCompany(id),
    getCompanyPackage(packageKey),
  ]);

  if (!company || !companyPackage) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <PageNavigation backHref={`/companies/${id}/packages`} backLabel="Packages" />
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <h1 className="text-2xl font-bold">Package details not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Please go back and select a company package again.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/companies/${id}/packages`}>Choose Package</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  const message = `Hello Kamker, I want to activate ${companyPackage.title} for ${company.company_name}. Amount: ${formatPrice(companyPackage.price_pkr)}. Company ID: ${company.id}`;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation backHref={`/companies/${id}/packages`} backLabel="Packages" />

        <div className="mt-5">
          <Badge variant="secondary" className="gap-1.5">
            <ReceiptText className="size-3.5" aria-hidden="true" />
            Package activation
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">
            Activate {companyPackage.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload your payment receipt. Clear matching receipts are approved by AI automatically, so your company can start adding staff profiles without waiting for admin.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-xl font-bold">Selected package</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {company.company_name} · {company.category} · {company.city}
              </p>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-semibold">{companyPackage.title}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold">{formatPrice(companyPackage.price_pkr)} / month</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Total listings</span>
                  <span className="font-semibold">{companyPackage.listings_limit}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Featured listings</span>
                  <span className="font-semibold">{companyPackage.featured_limit}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-semibold">{companyPackage.duration_days} days</span>
                </div>
              </div>

              <Button asChild className="mt-6 h-12 w-full bg-[#25d366] text-white hover:bg-[#21bd5b]">
                <a href={whatsappLink(message)}>
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Ask Kamker on WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              {statusMessage ? (
                <DismissibleNotice className="mb-5 rounded-lg border bg-secondary/60 p-4 text-sm font-medium" closeLabel="Close payment message">
                  {statusMessage}
                </DismissibleNotice>
              ) : null}

              <div className="flex gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <UploadCloud className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Upload payment receipt</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Submit the receipt or transfer screenshot here. Kamker AI checks the visible amount and reference. If it matches, the package activates automatically.
                  </p>
                </div>
              </div>

              <form action={submitCompanyPackagePayment} className="mt-5 grid gap-4">
                <input type="hidden" name="companyId" value={company.id} />
                <input type="hidden" name="packageKey" value={companyPackage.package_key} />

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Payment method</span>
                  <select
                    name="paymentMethod"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue="JazzCash/EasyPaisa"
                  >
                    <option>JazzCash/EasyPaisa</option>
                    <option>Bank Transfer</option>
                    <option>Raast</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Payer name</span>
                  <input
                    name="payerName"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Name used for payment"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Sender phone</span>
                  <input
                    name="senderPhone"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="03..."
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
                    accept="image/jpeg,image/png,image/webp"
                    className="rounded-md border border-dashed border-input bg-background px-3 py-3 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                  />
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, or WebP. Maximum 3MB.
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium">Notes</span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Optional payment note"
                  />
                </label>

                <Button className="h-12 w-full">
                  <UploadCloud className="size-4" aria-hidden="true" />
                  Upload Receipt for Review
                </Button>
              </form>

              <DismissibleNotice className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" closeLabel="Close directory warning">
                <p className="font-semibold">Directory only</p>
                <p className="mt-1">
                  Kamker is not an agency and does not sell weapons or ammunition. Customers should verify licenses and provider details before hiring.
                </p>
              </DismissibleNotice>

              <div className="mt-5 flex gap-3 rounded-lg border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p>
                  Package benefits start automatically when AI verifies the receipt. If the receipt is unclear, it stays pending for manual admin review.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
