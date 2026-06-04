import Link from "next/link";
import { MessageCircle, ReceiptText, ShieldCheck } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Activate Company Package | Kamker",
  description: "Contact Kamker to activate a company professional package.",
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
  searchParams?: Promise<{ package?: string }>;
};

const supportWhatsappNumber = process.env.NEXT_PUBLIC_KAMKER_SUPPORT_WHATSAPP || "923000000000";

function formatPrice(value: number) {
  return `Rs ${value.toLocaleString("en-PK")}`;
}

function whatsappLink(message: string) {
  const cleanNumber = supportWhatsappNumber.replace(/\D/g, "");

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

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
            Contact Kamker support to activate this company package. The team will review the company and share the next steps directly.
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
                  Contact Kamker on WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Review before activation</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Package benefits start after Kamker confirms the company details and activation request. Once active, the company can publish multiple professionals according to the package limit. Security, bodyguard, and firearm training related companies may need extra verification.
                  </p>
                </div>
              </div>

              <DismissibleNotice className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" closeLabel="Close directory warning">
                <p className="font-semibold">Directory only</p>
                <p className="mt-1">
                  Kamker is not an agency and does not sell weapons or ammunition. Customers should verify licenses and provider details before hiring.
                </p>
              </DismissibleNotice>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
