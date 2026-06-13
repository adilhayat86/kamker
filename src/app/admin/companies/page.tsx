import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import {
  activateCompanyPackage,
  approveCompanyVerification,
  rejectCompanyVerification,
} from "@/app/admin/actions";
import { AdminSection, AdminShell } from "@/components/admin/admin-ui";
import { DismissibleCard, DismissibleNotice } from "@/components/dismissible-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import {
  getActiveCompanySubscription,
  getPublishedCompanyListingUsage,
} from "@/lib/company-packages";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Companies | Kamker Admin",
  description: "Review company registrations on Kamker.",
};

export const dynamic = "force-dynamic";

type Company = {
  id: string;
  company_name: string;
  category: string;
  city: string;
  area: string | null;
  contact_person: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  license_number: string | null;
  verification_status: string;
  payment_status: string;
  created_at: string;
};

type CompanyPackage = {
  package_key: string;
  title: string;
  listings_limit: number;
  featured_limit: number;
};

type CompaniesPageProps = {
  searchParams?: Promise<{
    q?: string;
    verification?: string;
    payment?: string;
  }>;
};

async function getCompanies({
  q,
  verification,
  payment,
}: {
  q?: string;
  verification?: string;
  payment?: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as Company[];
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, category, city, area, contact_person, phone, whatsapp, description, license_number, verification_status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.error("Failed to load companies", error);
    return [] as Company[];
  }

  return ((data ?? []) as Company[]).filter((company) => {
    const query = q?.trim().toLowerCase();
    const matchesQuery = query
      ? [
          company.company_name,
          company.category,
          company.city,
          company.area,
          company.contact_person,
          company.phone,
          company.whatsapp,
        ].some((value) => value?.toLowerCase().includes(query))
      : true;
    const matchesVerification = verification
      ? company.verification_status === verification
      : true;
    const matchesPayment = payment ? company.payment_status === payment : true;

    return matchesQuery && matchesVerification && matchesPayment;
  });
}

async function getCompanyPackages() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CompanyPackage[];
  }

  const { data, error } = await supabase
    .from("company_packages")
    .select("package_key, title, listings_limit, featured_limit")
    .eq("active", true)
    .order("price_pkr", { ascending: true });

  if (error) {
    console.error("Failed to load company packages", error);
    return [] as CompanyPackage[];
  }

  return (data ?? []) as CompanyPackage[];
}

function isSensitiveCategory(category: string) {
  const value = category.toLowerCase();

  return value.includes("security") || value.includes("bodyguard") || value.includes("firearm") || value.includes("fire safety");
}

export default async function AdminCompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const [companies, companyPackages] = await Promise.all([
    getCompanies({
      q: params?.q,
      verification: params?.verification,
      payment: params?.payment,
    }),
    getCompanyPackages(),
  ]);
  const companiesWithUsage = await Promise.all(
    companies.map(async (company) => {
      const [subscription, usage] = await Promise.all([
        getActiveCompanySubscription(company.id),
        getPublishedCompanyListingUsage(company.id),
      ]);

      return { company, subscription, usage };
    }),
  );

  return (
    <AdminShell
      active="/admin/companies"
      title="Companies"
      description="Review company registrations, payment status, package activation, and verification status."
      actions={
        <Button asChild variant="outline">
          <Link href="/register/company">Register Test Company</Link>
        </Button>
      }
    >
        {!isSupabaseConfigured ? (
          <DismissibleCard
            className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
            cardContentClassName="p-4"
            contentClassName="flex gap-3"
            closeLabel="Close Supabase warning"
          >
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Supabase is not configured</p>
                  <p className="mt-1 text-sm text-amber-900">Company records will appear here after Supabase is configured.</p>
                </div>
          </DismissibleCard>
        ) : null}

        <AdminSection
          title="Search & Filters"
          description="Find companies by name, city, category, contact person, phone, payment, or verification status."
        >
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            <input
              name="q"
              defaultValue={params?.q ?? ""}
              placeholder="Search company, city, phone"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            />
            <select
              name="verification"
              defaultValue={params?.verification ?? ""}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            >
              <option value="">All verification</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              name="payment"
              defaultValue={params?.payment ?? ""}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            >
              <option value="">All payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending_review">Pending review</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button>Filter</Button>
          </form>
          <div className="mt-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/companies">Reset filters</Link>
            </Button>
          </div>
        </AdminSection>

        <div className="mt-6 grid gap-4">
          {companies.length > 0 ? (
            companiesWithUsage.map(({ company, subscription, usage }) => (
              <Card key={company.id} className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{company.company_name}</h2>
                        <Badge variant="outline">Payment: {company.payment_status}</Badge>
                        <Badge variant="outline">Verification: {company.verification_status}</Badge>
                        {subscription ? (
                          <Badge>{subscription.package_title}</Badge>
                        ) : (
                          <Badge variant="secondary">No active package</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {company.category} · {company.city}{company.area ? ` · ${company.area}` : ""}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                      <Link href={`/companies/${company.id}/packages`}>View Packages</Link>
                    </Button>
                  </div>

                  {isSensitiveCategory(company.category) ? (
                    <DismissibleNotice className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950" closeLabel="Close verification warning">
                      <p className="font-semibold">Extra verification needed</p>
                      <p>Kamker is a directory only. Approve only legal/licensed providers. Do not approve weapon or ammunition sales.</p>
                    </DismissibleNotice>
                  ) : null}

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <span>Contact: {company.contact_person ?? "Not provided"}</span>
                    <span>Phone: {company.phone ?? "Not provided"}</span>
                    <span>WhatsApp: {company.whatsapp ?? "Not provided"}</span>
                    <span>License: {company.license_number ? "Provided" : "Not provided"}</span>
                    <span>Created: {new Date(company.created_at).toLocaleDateString("en-PK")}</span>
                    <span>ID: {company.id}</span>
                    <span>Published: {subscription ? `${usage.published}/${subscription.listings_limit}` : `${usage.published}/0`}</span>
                    <span>Featured: {subscription ? `${usage.featured}/${subscription.featured_limit}` : `${usage.featured}/0`}</span>
                    <span>Package expires: {subscription ? new Date(subscription.expires_at).toLocaleDateString("en-PK") : "Not active"}</span>
                  </div>

                  {company.description ? (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{company.description}</p>
                  ) : null}

                  <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm font-semibold">Package activation</p>
                    <form action={activateCompanyPackage} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input type="hidden" name="companyId" value={company.id} />
                      <select
                        name="packageKey"
                        className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        defaultValue={subscription?.package_key ?? companyPackages[0]?.package_key ?? ""}
                        disabled={!adminAuthenticated || companyPackages.length === 0}
                      >
                        {companyPackages.map((companyPackage) => (
                          <option key={companyPackage.package_key} value={companyPackage.package_key}>
                            {companyPackage.title} · {companyPackage.listings_limit} listings · {companyPackage.featured_limit} featured
                          </option>
                        ))}
                      </select>
                      <Button type="submit" disabled={!adminAuthenticated || companyPackages.length === 0}>
                        Activate Package
                      </Button>
                    </form>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <form action={approveCompanyVerification}>
                      <input type="hidden" name="companyId" value={company.id} />
                      <Button
                        className="w-full"
                        type="submit"
                        disabled={!adminAuthenticated || company.verification_status === "verified"}
                      >
                        Approve Verification
                      </Button>
                    </form>
                    <form action={rejectCompanyVerification}>
                      <input type="hidden" name="companyId" value={company.id} />
                      <Button
                        className="w-full"
                        type="submit"
                        variant="outline"
                        disabled={!adminAuthenticated || company.verification_status === "rejected"}
                      >
                        Reject Verification
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-5 text-sm text-muted-foreground">
                No company registrations found yet.
              </CardContent>
            </Card>
          )}
        </div>
    </AdminShell>
  );
}
