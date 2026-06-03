import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";

import { approveCompanyListing, rejectCompanyListing } from "@/app/admin/actions";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Company Listings | Kamker Admin",
};

export const dynamic = "force-dynamic";

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
  created_at: string;
  companies: { id: string; company_name: string; verification_status: string } | null;
};

async function getListings() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CompanyListing[];
  }

  const { data, error } = await supabase
    .from("company_listings")
    .select("id, title, category, city, area, description, hourly_rate, monthly_rate, phone, whatsapp, status, created_at, companies(id, company_name, verification_status)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load company listings", error);
    return [] as CompanyListing[];
  }

  return (data ?? []) as unknown as CompanyListing[];
}

export default async function AdminCompanyListingsPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const listings = await getListings();

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <PageNavigation backHref="/admin" backLabel="Admin" />

        <div className="mt-5">
          <Badge variant="secondary" className="gap-1.5">
            <ClipboardList className="size-3.5" aria-hidden="true" />
            Review queue
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Company Listings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Approve or reject staff and service listings submitted by companies.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <Card key={listing.id} className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold">{listing.title}</h2>
                        <Badge variant="outline">{listing.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {listing.category} · {listing.city}{listing.area ? ` · ${listing.area}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Company: {listing.companies?.company_name ?? "Unknown"} · Verification: {listing.companies?.verification_status ?? "unknown"}
                      </p>
                    </div>
                    {listing.companies?.id ? (
                      <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href={`/companies/${listing.companies.id}/dashboard`}>Company Dashboard</Link>
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <span>Hourly: {listing.hourly_rate ? `Rs ${listing.hourly_rate}` : "Not provided"}</span>
                    <span>Monthly: {listing.monthly_rate ? `Rs ${listing.monthly_rate}` : "Not provided"}</span>
                    <span>Phone: {listing.phone ?? "Not provided"}</span>
                    <span>WhatsApp: {listing.whatsapp ?? "Not provided"}</span>
                    <span>Created: {new Date(listing.created_at).toLocaleDateString("en-PK")}</span>
                    <span>ID: {listing.id}</span>
                  </div>

                  {listing.description ? (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{listing.description}</p>
                  ) : null}

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <form action={approveCompanyListing}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <Button className="w-full" disabled={!adminAuthenticated || listing.status === "approved"}>
                        Approve Listing
                      </Button>
                    </form>
                    <form action={rejectCompanyListing}>
                      <input type="hidden" name="listingId" value={listing.id} />
                      <Button className="w-full" variant="outline" disabled={!adminAuthenticated || listing.status === "rejected"}>
                        Reject Listing
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white shadow-sm">
              <CardContent className="p-5 text-sm text-muted-foreground">No company listings found yet.</CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
