import Link from "next/link";
import { CheckCircle2, Crown, ListChecks, Star } from "lucide-react";

import { DismissibleCard } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getLocalCompanyRecordById,
  isLocalDemoStoreEnabled,
} from "@/lib/local-demo-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Choose Company Package | Kamker",
  description: "Choose a Kamker package for company-managed staff profiles.",
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
  searchParams?: Promise<{
    status?: "local-demo";
  }>;
};

const localDemoPackages: CompanyPackage[] = [
  {
    id: "local-company-starter",
    package_key: "company_starter_monthly",
    title: "Starter Company",
    description: "20 listings, 5 featured listings",
    price_pkr: 3000,
    duration_days: 30,
    listings_limit: 20,
    featured_limit: 5,
  },
  {
    id: "local-company-growth",
    package_key: "company_growth_monthly",
    title: "Growth Company",
    description: "50 listings, 15 featured listings",
    price_pkr: 7000,
    duration_days: 30,
    listings_limit: 50,
    featured_limit: 15,
  },
  {
    id: "local-company-enterprise",
    package_key: "company_enterprise_monthly",
    title: "Enterprise Company",
    description: "100 listings, 35 featured listings",
    price_pkr: 15000,
    duration_days: 30,
    listings_limit: 100,
    featured_limit: 35,
  },
];

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
    const localCompany = await getLocalCompanyRecordById(companyId);

    if (localCompany) {
      return {
        id: localCompany.id,
        company_name: localCompany.company_name,
        category: localCompany.category,
        city: localCompany.city,
        payment_status: localCompany.payment_status,
        verification_status: localCompany.verification_status,
      } satisfies Company;
    }

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
    if (isLocalDemoStoreEnabled) {
      return localDemoPackages;
    }

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

export default async function CompanyPackagesPage({
  params,
  searchParams,
}: CompanyPackagesPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const isLocalDemoCompany = id.startsWith("local-company-");
  const [company, packages] = await Promise.all([getCompany(id), getCompanyPackages()]);

  if ((!isSupabaseConfigured || !supabase) && !company) {
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

        {query?.status === "local-demo" ? (
          <DismissibleCard
            className="mt-6 border-sky-200 bg-sky-50 shadow-sm"
            cardContentClassName="p-4 text-sm leading-6 text-sky-950"
            closeLabel="Close local demo notice"
          >
            Local demo company saved. Packages below use the same values from schema.sql, and the demo package is considered active so you can test uploading workers.
          </DismissibleCard>
        ) : null}

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
              Select how many company-managed staff profiles your company can publish. Each staff profile can use any Kamker service group and profession category.
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
                        <span>{companyPackage.listings_limit} published staff profiles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                        <span>{companyPackage.featured_limit} featured professionals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                        <span>Company profile saved for admin review</span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {companyPackage.description ??
                        `${companyPackage.listings_limit} published staff profiles with ${companyPackage.featured_limit} featured.`}
                    </p>

                    <Button asChild className="mt-auto h-12 w-full">
                      <Link
                        href={
                          isLocalDemoCompany
                            ? `/companies/${company.id}/dashboard`
                            : `/companies/${company.id}/payment?package=${companyPackage.package_key}`
                        }
                      >
                        {isLocalDemoCompany ? "Continue to Dashboard" : "Select Package"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DismissibleCard
          className="mt-6 border-amber-200 bg-amber-50 shadow-sm"
          cardContentClassName="p-5 text-sm leading-6 text-amber-950"
          closeLabel="Close payment notice"
        >
          <p className="font-semibold">Receipt upload next</p>
          <p className="mt-1">
            Upload your payment receipt after choosing a package. Clear matching receipts can activate automatically by AI review; unclear receipts stay pending for admin review.
          </p>
        </DismissibleCard>
      </section>
    </main>
  );
}
