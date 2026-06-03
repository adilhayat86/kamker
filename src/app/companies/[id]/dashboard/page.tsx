import Link from "next/link";
import { Building2, ListChecks, PlusCircle } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Company Dashboard | Kamker",
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
  verification_status: string;
};

type CompanyListing = {
  id: string;
  title: string;
  category: string;
  city: string;
  area: string | null;
  description: string | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
};

type CompanyDashboardPageProps = {
  params: Promise<{ id: string }>;
};

async function getCompany(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, category, city, area, contact_person, phone, whatsapp, description, verification_status")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company", error);
    return null;
  }

  return data as Company | null;
}

async function getCompanyListings(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CompanyListing[];
  }

  const { data, error } = await supabase
    .from("company_listings")
    .select("id, title, category, city, area, description, hourly_rate, monthly_rate, phone, whatsapp, status")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load company listings", error);
    return [] as CompanyListing[];
  }

  return (data ?? []) as CompanyListing[];
}

export default async function CompanyDashboardPage({ params }: CompanyDashboardPageProps) {
  const { id } = await params;
  const [company, listings] = await Promise.all([getCompany(id), getCompanyListings(id)]);

  if (!company) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <PageNavigation backHref="/register/company" backLabel="Company Registration" />
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <h1 className="text-2xl font-bold">Company not found</h1>
              <p className="mt-2 text-sm text-muted-foreground">Register a company before managing listings.</p>
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
      <section className="mx-auto max-w-7xl">
        <PageNavigation backHref={`/companies/${company.id}/packages`} backLabel="Packages" />

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <Building2 className="size-3.5" aria-hidden="true" />
              Company dashboard
            </Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-normal">{company.company_name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage company details and staff or service listings from one place.
            </p>
          </div>
          <Button asChild className="h-12 w-full sm:w-auto">
            <Link href={`/companies/${company.id}/listings/new`}>
              <PlusCircle className="size-4" aria-hidden="true" />
              Add Listing
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <ListChecks className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-4 text-2xl font-bold">{listings.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Company listings</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <Building2 className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-4 text-2xl font-bold capitalize">{company.verification_status}</p>
              <p className="mt-1 text-sm text-muted-foreground">Verification status</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold">Company details</h2>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <span>Category: {company.category}</span>
              <span>City: {company.city}</span>
              <span>Area: {company.area ?? "Not provided"}</span>
              <span>Contact: {company.contact_person ?? "Not provided"}</span>
              <span>Phone: {company.phone ?? "Not provided"}</span>
              <span>WhatsApp: {company.whatsapp ?? "Not provided"}</span>
            </div>
            {company.description ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{company.description}</p> : null}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Listings</h2>
                <p className="mt-1 text-sm text-muted-foreground">Add staff or services under this company.</p>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={`/companies/${company.id}/listings/new`}>Add Listing</Link>
              </Button>
            </div>

            {listings.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {listings.map((listing) => (
                  <div key={listing.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{listing.title}</p>
                      <Badge variant="outline">{listing.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {listing.category} · {listing.city}{listing.area ? ` · ${listing.area}` : ""}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                      <span>Hourly: {listing.hourly_rate ? `Rs ${listing.hourly_rate}` : "Not provided"}</span>
                      <span>Monthly: {listing.monthly_rate ? `Rs ${listing.monthly_rate}` : "Not provided"}</span>
                      <span>Phone: {listing.phone ?? "Not provided"}</span>
                      <span>WhatsApp: {listing.whatsapp ?? "Not provided"}</span>
                    </div>
                    {listing.description ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{listing.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No company listings yet. Add your first staff or service listing.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
