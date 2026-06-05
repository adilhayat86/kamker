import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Building2, MapPin, MessageCircle, Phone, Sparkles, Star } from "lucide-react";
import { notFound } from "next/navigation";

import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getMockCompanyListingById,
  type CompanyListingCardRow,
} from "@/lib/company-listing-cards";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CompanyListingDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatRate(listing: Pick<CompanyListingCardRow, "hourly_rate" | "monthly_rate">) {
  if (listing.hourly_rate) {
    return `Rs ${listing.hourly_rate.toLocaleString("en-PK")}/hour`;
  }

  if (listing.monthly_rate) {
    return `Rs ${listing.monthly_rate.toLocaleString("en-PK")}/month`;
  }

  return "Ask company for rate";
}

function whatsappHref(value: string | null, title: string) {
  if (!value) {
    return null;
  }

  return `https://wa.me/${value.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello, I found ${title} on Kamker.`)}`;
}

async function getListing(id: string) {
  if (id.startsWith("mock-company-")) {
    return getMockCompanyListingById(id);
  }

  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("company_listings")
    .select("id, title, service_group, category, city, area, description, hourly_rate, monthly_rate, profile_photo_url, photo_url, tagline, gender, age, availability, years_experience, phone, whatsapp, is_featured, companies(id, company_name, verification_status, logo_url)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    console.error("Failed to load company listing profile", error);
    return null;
  }

  return data as unknown as CompanyListingCardRow | null;
}

export async function generateMetadata({ params }: CompanyListingDetailPageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    return {
      title: "Company Professional | Kamker",
    };
  }

  const companyName = listing.companies?.company_name ?? "Company";

  return {
    title: `${listing.title} - ${listing.category} by ${companyName} | Kamker`,
    description: `${listing.tagline ?? listing.category} in ${listing.city}. Company-managed professional profile on Kamker.`,
  };
}

export default async function CompanyListingDetailPage({ params }: CompanyListingDetailPageProps) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    notFound();
  }

  const whatsapp = whatsappHref(listing.whatsapp, listing.title);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation backHref="/professionals" backLabel="Professionals" />

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-7">
            <div className="grid gap-6 md:grid-cols-[180px_1fr]">
              <Image
                src={listing.profile_photo_url ?? listing.photo_url ?? "/kamker-professionals.png"}
                alt={`${listing.title} profile photo`}
                width={180}
                height={180}
                priority
                className="size-36 rounded-2xl bg-accent object-cover sm:size-44"
              />
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <Building2 className="size-3" aria-hidden="true" />
                    Company Managed
                  </Badge>
                  {listing.companies?.verification_status === "verified" ? (
                    <Badge variant="outline">
                      <BadgeCheck className="size-3" aria-hidden="true" />
                      Verified Company
                    </Badge>
                  ) : null}
                  {listing.is_featured ? (
                    <Badge className="gap-1 bg-[#f6c343] text-[#241a04] hover:bg-[#f6c343]">
                      <Sparkles className="size-3" aria-hidden="true" />
                      Featured
                    </Badge>
                  ) : null}
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-normal">{listing.title}</h1>
                <p className="mt-1 text-lg font-semibold text-primary">{listing.category}</p>
                {listing.tagline ? (
                  <p className="mt-2 text-base font-medium">{listing.tagline}</p>
                ) : null}
                <p className="mt-4 text-3xl font-bold text-primary">{formatRate(listing)}</p>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {listing.city}{listing.area ? `, ${listing.area}` : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                    {listing.years_experience ?? 0} years experience
                  </span>
                  <span>Availability: {listing.availability ?? "Ask company"}</span>
                  <span>Age: {listing.age ? `Age ${listing.age}` : "Age not added"}</span>
                  <span>
                    Managed by:{" "}
                    {listing.companies?.id ? (
                      <Link className="font-medium text-primary" href={`/companies/${listing.companies.id}`}>
                        {listing.companies.company_name}
                      </Link>
                    ) : (
                      "Company"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {listing.description ? (
              <div className="mt-6 border-t pt-5">
                <h2 className="text-xl font-semibold">Profile details</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{listing.description}</p>
              </div>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {listing.phone ? (
                <Button asChild variant="outline" className="h-12">
                  <a href={`tel:${listing.phone}`}>
                    <Phone className="size-4" aria-hidden="true" />
                    Call
                  </a>
                </Button>
              ) : null}
              {whatsapp ? (
                <Button asChild className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                  <a href={whatsapp}>
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                </Button>
              ) : null}
              <Button asChild className="h-12" variant="outline">
                <Link href={`/send-requirement?category=${encodeURIComponent(listing.category)}&city=${encodeURIComponent(listing.city)}${listing.area ? `&area=${encodeURIComponent(listing.area)}` : ""}`}>
                  Send Requirement
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
