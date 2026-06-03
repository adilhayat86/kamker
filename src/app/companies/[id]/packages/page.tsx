import Link from "next/link";
import { CheckCircle2, Crown, ListChecks, Star } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Choose Company Package | Kamker",
  description: "Choose a Kamker company listing package.",
};

type Company = {
  id: string;
  company_name: string;
  category: string;
  city: string;
  payment_status: string;
  verification_status: string;
};

type CompanyPackage = {
  id: string;
  package_key: string;
  title: string;
  description: string | null;
  price_pkr: number;
  duration_days: number;
  listings_limit: number;
  featured_limit: number;
};

type CompanyPackagesPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const packageOrder = [
  "company_starter_monthly",
  "company_growth_monthly",
  "company_enterprise_monthly",
];

function formatPrice(value: number) {
  return `Rs ${value.toLocaleString("en-PK")}`;
}

async function getCompany(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, category, city, payment_status, verification_status")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company", error);
    return null;
  }

  return data as Company | null;
}

async function getCompanyPackages() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CompanyPackage[];
  }

  const { data, error } = await supabase
    .from("company_packages")
    .select("id, package_key, title, description, price_pkr, duration_days, listings_limit, featured_limit")
    .eq("active", true);

  if (error) {
    console.error("Failed to load company packages", error);
    return [] as CompanyPackage[];
  }

  return ((data ?? []) as CompanyPackage[]).sort(
    (first, second) =>
      packageOrder.indexOf(first.package_key) - packageOrder.indexOf(second.package_key),
  );
}

export default async function CompanyPackagesPage({ params }: CompanyPackagesPageProps) {
  const { id } = await params;
  const [company, packages] = await Promise.all([getCompany(id), getCompanyPackages()]);

  if (!isSupabaseConfigured || !supabase) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <PageNavigation backHref="/register/company" backLabel="Company Registration" />
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <h1 className="text-2xl font-bold">Supabase is not configured</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Configure Supabase before selecting a company package.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <PageNavigation backHref="/register/company" backLabel="Company Registration" />
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <h1 className="text-2xl font-bold">Company not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Please register your company again or contact Kamker support.
              </p>
              <Button asChild className="mt-4">
                <Link href="/register/company">Register Company</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <PageNavigation backHref="/register/company" backLabel="Company Registration" />

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <Crown className="size-3.5" aria-hidden="true" />
              Company packages
            </Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-normal">
              Choose package for {company.company_name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Select how many staff or service listings your company needs. Manual payment review will come in the next step.
            </p>
          </div>
          <Card className="bg-white shadow-sm sm:w-80">
            <CardContent className="p-4 text-sm">
              <p className="font-semibold">{company.company_name}</p>
              <p className="text-muted-foreground">{company.category} · {company.city}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">Payment: {company.payment_status}</Badge>
                <Badge variant="outline">Verification: {company.verification_status}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {packages.length === 0 ? (
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold">No packages available yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Company packages are not loaded. Run the latest schema.sql in Supabase first.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {packages.map((companyPackage) => {
              const isPopular = companyPackage.package_key === "company_growth_monthly";

              return (
                <Card
                  key={companyPackage.id}
                  className={
                    isPopular
                      ? "border-primary/40 bg-white shadow-md"
                      : "bg-white shadow-sm"
                  }
                >
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold">{companyPackage.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {companyPackage.duration_days} days package
                        </p>
                      </div>
                      {isPopular ? (
                        <Badge className="gap-1 bg-primary text-primary-foreground">
                          <Star className="size-3" aria-hidden="true" />
                          Popular
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-5 text-3xl font-bold text-primary">
                      {formatPrice(companyPackage.price_pkr)}
                      <span className="text-sm font-medium text-muted-foreground"> / month</span>
                    </p>

                    <div className="mt-5 grid gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <ListChecks className="size-4 text-primary" aria-hidden="true" />
                        <span>{companyPackage.listings_limit} total listings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                        <span>{companyPackage.featured_limit} featured listings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                        <span>Company profile saved for admin review</span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {companyPackage.description ??
                        `${companyPackage.listings_limit} listings with ${companyPackage.featured_limit} featured.`}
                    </p>

                    <Button asChild className="mt-auto h-12 w-full">
                      <Link href={`/companies/${company.id}/payment?package=${companyPackage.package_key}`}>
                        Select Package
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-6 border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="p-5 text-sm leading-6 text-amber-950">
            <p className="font-semibold">Manual payment next</p>
            <p className="mt-1">
              In the next phase, selecting a package will open a manual payment form for JazzCash/EasyPaisa/bank reference submission. Package benefits will activate only after admin approval.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
