import Link from "next/link";
import { Building2, MapPin, Phone, Search } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categories, cities } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Company Professionals | Kamker",
  description: "Browse approved company-managed professionals on Kamker.",
};

export const dynamic = "force-dynamic";

type CompanyListing = {
  id: string;
  title: string;
  service_group: string | null;
  category: string;
  city: string;
  area: string | null;
  description: string | null;
  tagline: string | null;
  availability: string | null;
  years_experience: number | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  phone: string | null;
  whatsapp: string | null;
  is_featured: boolean;
  companies: { id: string; company_name: string; verification_status: string } | null;
};

type CompanyListingsPageProps = {
  searchParams?: Promise<{
    category?: string;
    city?: string;
  }>;
};

async function getListings(category?: string, city?: string) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CompanyListing[];
  }

  let query = supabase
    .from("company_listings")
    .select("id, title, service_group, category, city, area, description, tagline, availability, years_experience, hourly_rate, monthly_rate, phone, whatsapp, is_featured, companies(id, company_name, verification_status)")
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (category) {
    query = query.eq("category", category);
  }

  if (city) {
    query = query.eq("city", city);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load public company listings", error);
    return [] as CompanyListing[];
  }

  return (data ?? []) as unknown as CompanyListing[];
}

function whatsappHref(value: string | null, title: string) {
  if (!value) {
    return null;
  }

  const clean = value.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(`Hello, I found your ${title} profile on Kamker.`)}`;
}

export default async function CompanyListingsPage({ searchParams }: CompanyListingsPageProps) {
  const params = await searchParams;
  const category = params?.category && categories.some((item) => item.name === params.category) ? params.category : "";
  const city = params?.city && cities.includes(params.city) ? params.city : "";
  const listings = await getListings(category || undefined, city || undefined);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <PageNavigation />

        <div className="mt-5 rounded-xl bg-white p-5 shadow-sm">
          <Badge variant="secondary" className="gap-1.5">
            <Building2 className="size-3.5" aria-hidden="true" />
            Company managed
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Company Professionals</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse approved workers and professionals submitted by companies under active packages.
          </p>
        </div>

        <Card className="mt-5 bg-white shadow-sm">
          <CardContent className="p-5">
            <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-2 text-sm font-medium">
                Category
                <select name="category" defaultValue={category} className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item.name} value={item.name}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                City
                <select name="city" defaultValue={city} className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">All cities</option>
                  {cities.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <Button className="h-11 self-end">
                <Search className="size-4" aria-hidden="true" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {listings.length > 0 ? (
            listings.map((listing) => {
              const whatsapp = whatsappHref(listing.whatsapp, listing.title);

              return (
                <Card key={listing.id} className="bg-white shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">{listing.title}</h2>
                      {listing.is_featured ? <Badge>Featured</Badge> : null}
                      <Badge variant="secondary">Company Managed</Badge>
                      {listing.companies?.verification_status === "verified" ? (
                        <Badge variant="outline">Verified company</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {listing.companies?.company_name ?? "Company listing"}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-4" aria-hidden="true" />
                      {listing.service_group ?? "Service"} · {listing.category} · {listing.city}{listing.area ? ` · ${listing.area}` : ""}
                    </p>

                    {listing.tagline ? (
                      <p className="mt-3 truncate text-sm font-medium">{listing.tagline}</p>
                    ) : null}

                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <span>Hourly: {listing.hourly_rate ? `Rs ${listing.hourly_rate}` : "Ask company"}</span>
                      <span>Monthly: {listing.monthly_rate ? `Rs ${listing.monthly_rate}` : "Ask company"}</span>
                      <span>Availability: {listing.availability ?? "Ask company"}</span>
                      <span>Experience: {listing.years_experience ?? 0} years</span>
                    </div>

                    {listing.description ? (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">{listing.description}</p>
                    ) : null}

                    <div className="mt-5 grid gap-2 sm:grid-cols-3">
                      {listing.phone ? (
                        <Button asChild variant="outline" className="w-full">
                          <a href={`tel:${listing.phone}`}>
                            <Phone className="size-4" aria-hidden="true" />
                            Call
                          </a>
                        </Button>
                      ) : null}
                      {whatsapp ? (
                        <Button asChild className="w-full bg-[#25d366] text-white hover:bg-[#21bd5b]">
                          <a href={whatsapp}>WhatsApp</a>
                        </Button>
                      ) : null}
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/company-listings/${listing.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="bg-white shadow-sm lg:col-span-2">
              <CardContent className="p-5 text-sm text-muted-foreground">
                No approved company professionals found for this search yet.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
