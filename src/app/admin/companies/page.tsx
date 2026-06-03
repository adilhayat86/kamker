import Link from "next/link";
import { Building2, ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { approveCompanyVerification, rejectCompanyVerification } from "@/app/admin/actions";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
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

async function getCompanies() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as Company[];
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, category, city, area, contact_person, phone, whatsapp, description, license_number, verification_status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load companies", error);
    return [] as Company[];
  }

  return (data ?? []) as Company[];
}

function isSensitiveCategory(category: string) {
  const value = category.toLowerCase();

  return value.includes("security") || value.includes("bodyguard") || value.includes("firearm") || value.includes("fire safety");
}

export default async function AdminCompaniesPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const companies = await getCompanies();

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <PageNavigation backHref="/admin" backLabel="Admin" />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <Building2 className="size-3.5" aria-hidden="true" />
              Company registrations
            </Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-normal">Companies</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review company registrations, payment status, and verification status.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/register/company">Register Test Company</Link>
          </Button>
        </div>

        {!isSupabaseConfigured ? (
          <Card className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm">
            <CardContent className="flex gap-3 p-4">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Supabase is not configured</p>
                <p className="mt-1 text-sm text-amber-900">Company records will appear here after Supabase is configured.</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-6 grid gap-4">
          {companies.length > 0 ? (
            companies.map((company) => (
              <Card key={company.id} className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{company.company_name}</h2>
                        <Badge variant="outline">Payment: {company.payment_status}</Badge>
                        <Badge variant="outline">Verification: {company.verification_status}</Badge>
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
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                      <p className="font-semibold">Extra verification needed</p>
                      <p>Kamker is a directory only. Approve only legal/licensed providers. Do not approve weapon or ammunition sales.</p>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <span>Contact: {company.contact_person ?? "Not provided"}</span>
                    <span>Phone: {company.phone ?? "Not provided"}</span>
                    <span>WhatsApp: {company.whatsapp ?? "Not provided"}</span>
                    <span>License: {company.license_number ? "Provided" : "Not provided"}</span>
                    <span>Created: {new Date(company.created_at).toLocaleDateString("en-PK")}</span>
                    <span>ID: {company.id}</span>
                  </div>

                  {company.description ? (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{company.description}</p>
                  ) : null}

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
      </section>
    </main>
  );
}
