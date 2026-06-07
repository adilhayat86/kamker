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
import { trackedContactHref } from "@/lib/contact-tracking";
import {
  getLocalCompanyListingRecords,
  getLocalCompanyRecordById,
} from "@/lib/local-demo-store";
import { whatsappHref as buildWhatsappHref } from "@/lib/phone";
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
  return buildWhatsappHref(value, `Hello, I found ${title} on Kamker.`);
}

async function getListing(id: string) {
  if (id.startsWith("mock-company-")) {
    return getMockCompanyListingById(id);
  }

  if (!isSupabaseConfigured || !supabase) {
    const localListings = await getLocalCompanyListingRecords();
    const localListing = localListings.find((listing) => listing.id === id);

    if (!localListing) {
      return null;
    }

    const localCompany = await getLocalCompanyRecordById(localListing.company_id);

    return {
      id: localListing.id,
      title: localListing.title,
      service_group: localListing.service_group,
      category: localListing.category,
      city: localListing.city,
      area: localListing.area,
      description: localListing.description,
      hourly_rate: localListing.hourly_rate,
      monthly_rate: localListing.monthly_rate,
      profile_photo_url: localListing.profile_photo_url,
      tagline: localListing.tagline,
      gender: localListing.gender,
      age: localListing.age,
      availability: localListing.availability,
      years_experience: localListing.years_experience,
      phone: localListing.phone,
      whatsapp: localListing.whatsapp,
      is_featured: localListing.is_featured,
      companies: localCompany
        ? {
            id: localCompany.id,
            company_name: localCompany.company_name,
            verification_status: localCompany.verification_status,
            logo_url: localCompany.logo_url,
          }
        : null,
    } satisfies CompanyListingCardRow;
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
  const listingPath = `/company-listings/${listing.id}`;
  const phoneHref = listing.phone ? `tel:${listing.phone}` : null;
  const trackedPhoneHref = trackedContactHref({
    href: phoneHref,
    eventType: "call_click",
    targetType: "company_listing",
    targetId: listing.id,
    path: listingPath,
    category: listing.category,
    city: listing.city,
  });
  const trackedWhatsappHref = trackedContactHref({
    href: whatsapp,
    eventType: "whatsapp_click",
    targetType: "company_listing",
    targetId: listing.id,
    path: listingPath,
    category: listing.category,
    city: listing.city,
  });

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

            {listing.companies?.id ? (
              <div className="mt-6 rounded-lg border bg-secondary/40 p-4">
                <p className="text-sm font-semibold text-foreground">Managed by company account</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This staff profile is created and managed by {listing.companies.company_name}.
                </p>
                <Button asChild variant="outline" className="mt-3 h-11 w-full sm:w-auto">
                  <Link href={`/companies/${listing.companies.id}`}>
                    <Building2 className="size-4" aria-hidden="true" />
                    Company Profile
                  </Link>
                </Button>
              </div>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {trackedPhoneHref ? (
                <Button asChild variant="outline" className="h-12">
                  <a href={trackedPhoneHref}>
                    <Phone className="size-4" aria-hidden="true" />
                    Call
                  </a>
                </Button>
              ) : null}
              {trackedWhatsappHref ? (
                <Button asChild className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                  <a href={trackedWhatsappHref}>
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
