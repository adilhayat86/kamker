import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Crown, ReceiptText, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

import { getAccountProfessional, isAccountFeatured } from "@/lib/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { manualPaymentConfig } from "@/lib/payment-config";

import { submitFeaturedProfileProof } from "./actions";

export const metadata = {
  title: "Get Featured | Kamker",
  description: "Choose a Kamker featured profile package and upload payment proof.",
};

const featuredPackages = [
  {
    key: "monthly",
    title: "Monthly Featured",
    price: "Rs 350",
    amount: 350,
    duration: "30 days",
    description: "Good for testing more visibility for one month.",
    recommended: false,
  },
  {
    key: "yearly",
    title: "1 Year Featured",
    price: "Rs 2,500",
    amount: 2500,
    duration: "365 days",
    description: "Best value for long-term featured placement.",
    recommended: true,
  },
] as const;

const statusMessages = {
  missing: "Choose a package and upload a jpg, png, or webp payment screenshot under 8MB.",
  "not-configured": "Supabase is not configured yet.",
  "upload-error": "Could not upload payment proof. Please try again.",
  "save-error": "Could not save AI proof review. Please try again.",
  "activation-error": "Payment proof was reviewed, but featured activation failed. Kamker admin should review it.",
  auto_approved: "Payment proof approved. Your profile is now featured.",
  needs_review: "Payment proof uploaded. Kamker admin will review it before activation.",
} as const;

type FeaturedProfilePageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

export default async function FeaturedProfilePage({
  searchParams,
}: FeaturedProfilePageProps) {
  const query = await searchParams;
  const status = query?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const professional = await getAccountProfessional();

  if (!professional) {
    redirect("/login");
  }

  const isFeatured = isAccountFeatured(professional);
  const profession = professional.categories?.name ?? "Professional";
  const city = professional.cities?.name ?? "Pakistan";

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation backHref="/account" backLabel="My Account" />

        <Card className="mt-5 overflow-hidden bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-primary via-sky-500 to-blue-700 p-6 text-primary-foreground sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-lg">
                  <Crown className="size-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-white/80">
                    Featured profile
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-normal">
                    Get more visibility on Kamker
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                    Choose a featured package, upload payment proof, and Kamker
                    AI will review the screenshot. Clear matching payments can
                    activate automatically.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-7">
              {statusMessage ? (
                <DismissibleNotice className="rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close featured status message">
                  {statusMessage}
                </DismissibleNotice>
              ) : null}

              <div className="rounded-xl border bg-blue-50/70 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Your profile
                </p>
                <p className="mt-2 text-2xl font-bold tracking-normal">
                  {professional.full_name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profession} in {city}
                  {professional.area ? `, ${professional.area}` : ""}
                </p>
                <Badge className="mt-3" variant={isFeatured ? "default" : "outline"}>
                  {isFeatured ? "Featured active" : "Get Featured"}
                </Badge>
              </div>

              <div className="rounded-xl border border-primary/20 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <ReceiptText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Payment account</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Pay the selected featured amount, then upload the receipt screenshot below.
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-lg bg-white p-3">
                    <dt className="text-muted-foreground">Method</dt>
                    <dd className="mt-1 font-semibold">{manualPaymentConfig.bankName}</dd>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <dt className="text-muted-foreground">Account title</dt>
                    <dd className="mt-1 font-semibold">{manualPaymentConfig.accountTitle}</dd>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <dt className="text-muted-foreground">Account number</dt>
                    <dd className="mt-1 font-semibold tracking-wide">
                      {manualPaymentConfig.accountNumber}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {featuredPackages.map((featuredPackage) => (
                  <Card
                    key={featuredPackage.key}
                    className={
                      featuredPackage.recommended
                        ? "border-primary/30 bg-white shadow-md"
                        : "bg-white shadow-sm"
                    }
                  >
                    <CardContent className="grid gap-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold">
                              {featuredPackage.title}
                            </h2>
                            {featuredPackage.recommended ? (
                              <Badge className="bg-[#f6c343] text-[#241a04] hover:bg-[#f6c343]">
                                Best value
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {featuredPackage.description}
                          </p>
                        </div>
                        <Sparkles className="size-6 shrink-0 text-primary" aria-hidden="true" />
                      </div>

                      <div className="rounded-xl border bg-background p-4">
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="mt-1 text-3xl font-bold text-primary">
                          {featuredPackage.price}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Featured for {featuredPackage.duration}
                        </p>
                      </div>

                      <form action={submitFeaturedProfileProof} className="grid gap-3">
                        <input
                          type="hidden"
                          name="packageKey"
                          value={featuredPackage.key}
                        />
                        <label className="grid gap-2 text-sm font-medium">
                          Payment screenshot
                          <input
                            name="proofImage"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                          />
                          <span className="text-xs font-normal text-muted-foreground">
                            JPG, PNG, or WebP. Maximum 8MB.
                          </span>
                        </label>
                        <Button className="h-12">
                          <UploadCloud className="size-4" aria-hidden="true" />
                          Upload Proof for {featuredPackage.price}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <ReceiptText className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold">Manual payment</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Pay through Kamker’s current manual payment process.
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <Bot className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold">AI proof review</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    AI checks visible amount and reference in the screenshot.
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold">Admin audit</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Unclear proofs stay pending for Kamker admin review.
                  </p>
                </div>
              </div>

              <Button asChild className="h-12" variant="outline">
                <Link href="/account">Back to Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
