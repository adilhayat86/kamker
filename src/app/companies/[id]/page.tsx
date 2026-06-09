import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { ContactActionButton } from "@/components/contact-action-button";
import { PageNavigation } from "@/components/page-navigation";
import { ProfilePhotoViewer } from "@/components/profile-photo-viewer";
import { ProfessionalCard } from "@/components/professional-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  companyListingToProfessionalCard,
  getMockCompanyListingsByCompanyId,
  getMockCompanyProfileById,
  type CompanyListingCardRow,
} from "@/lib/company-listing-cards";
import { getActiveCompanySubscription } from "@/lib/company-packages";
import { trackedContactHref } from "@/lib/contact-tracking";
import {
  getLocalCompanyListingRecords,
  getLocalCompanyRecordById,
} from "@/lib/local-demo-store";
import { whatsappHref as buildWhatsappHref } from "@/lib/phone";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CompanyProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    serviceGroup?: string;
    category?: string;
  }>;
};

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
  logo_url: string | null;
};

type CompanyMedia = {
  id: string;
  url: string;
  media_type: "image" | "video";
  caption: string | null;
};

async function getCompany(id: string) {
  const mockCompany = getMockCompanyProfileById(id);

  if (mockCompany) {
    return mockCompany;
  }

  if (!isSupabaseConfigured || !supabase) {
    const localCompany = await getLocalCompanyRecordById(id);

    if (localCompany) {
      return localCompany satisfies Company;
    }

    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, category, city, area, contact_person, phone, whatsapp, description, verification_status, logo_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company profile", error);
    return null;
  }

  return data as Company | null;
}

async function getCompanyStaff(companyId: string) {
  const mockListings = getMockCompanyListingsByCompanyId(companyId);

  if (mockListings.length > 0) {
    return mockListings;
  }

  if (!isSupabaseConfigured || !supabase) {
    const [localCompany, localListings] = await Promise.all([
      getLocalCompanyRecordById(companyId),
      getLocalCompanyListingRecords(companyId),
    ]);

    return localListings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      service_group: listing.service_group,
      category: listing.category,
      city: listing.city,
      area: listing.area,
      description: listing.description,
      hourly_rate: listing.hourly_rate,
      monthly_rate: listing.monthly_rate,
      profile_photo_url: listing.profile_photo_url,
      tagline: listing.tagline,
      gender: listing.gender,
      age: listing.age,
      availability: listing.availability,
      years_experience: listing.years_experience,
      phone: listing.phone,
      whatsapp: listing.whatsapp,
      is_featured: listing.is_featured,
      created_at: listing.created_at,
      companies: localCompany
        ? {
            id: localCompany.id,
            company_name: localCompany.company_name,
            verification_status: localCompany.verification_status,
            logo_url: localCompany.logo_url,
          }
        : null,
    })) satisfies CompanyListingCardRow[];
  }

  const { data, error } = await supabase
    .from("company_listings")
    .select("id, title, service_group, category, city, area, description, hourly_rate, monthly_rate, profile_photo_url, photo_url, tagline, gender, age, availability, years_experience, phone, whatsapp, is_featured, created_at, companies(id, company_name, verification_status, logo_url)")
    .eq("company_id", companyId)
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load company staff", error);
    return [] as CompanyListingCardRow[];
  }

  return (data ?? []) as unknown as CompanyListingCardRow[];
}

async function getCompanyMedia(companyId: string) {
  if (companyId.startsWith("mock-company-")) {
    return [] as CompanyMedia[];
  }

  if (!isSupabaseConfigured || !supabase) {
    return [] as CompanyMedia[];
  }

  const { data, error } = await supabase
    .from("company_media")
    .select("id, url, media_type, caption")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Failed to load company media", error);
    return [] as CompanyMedia[];
  }

  return (data ?? []) as CompanyMedia[];
}

function whatsappHref(value: string | null, companyName: string) {
  return buildWhatsappHref(value, `Hello, I found ${companyName} on Kamker.`);
}

export async function generateMetadata({ params }: CompanyProfilePageProps) {
  const { id } = await params;
  const company = await getCompany(id);

  if (!company) {
    return {
      title: "Company Profile | Kamker",
    };
  }

  return {
    title: `${company.company_name} - ${company.category} in ${company.city} | Kamker`,
    description:
      company.description ??
      `${company.company_name} company profile on Kamker. Browse company-managed staff profiles in ${company.city}.`,
  };
}

export default async function CompanyProfilePage({
  params,
  searchParams,
}: CompanyProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const isMockCompany = id.startsWith("mock-company-");
  const [company, staffListings, media, subscription] = await Promise.all([
    getCompany(id),
    getCompanyStaff(id),
    getCompanyMedia(id),
    isMockCompany ? Promise.resolve(null) : getActiveCompanySubscription(id),
  ]);

  if (!company) {
    notFound();
  }

  const serviceGroups = Array.from(
    new Set(staffListings.map((listing) => listing.service_group).filter(Boolean)),
  ) as string[];
  const categories = Array.from(new Set(staffListings.map((listing) => listing.category)));
  const featuredCount = staffListings.filter((listing) => listing.is_featured).length;
  const filteredStaff = staffListings.filter((listing) => {
    const serviceGroupMatch = query?.serviceGroup
      ? listing.service_group === query.serviceGroup
      : true;
    const categoryMatch = query?.category ? listing.category === query.category : true;

    return serviceGroupMatch && categoryMatch;
  });
  const staffCards = filteredStaff.map(companyListingToProfessionalCard);
  const whatsapp = whatsappHref(company.whatsapp, company.company_name);
  const companyPath = `/companies/${company.id}`;
  const phoneHref = company.phone ? `tel:${company.phone}` : null;
  const trackedPhoneHref = trackedContactHref({
    href: phoneHref,
    eventType: "call_click",
    targetType: "company",
    targetId: company.id,
    path: companyPath,
    category: company.category,
    city: company.city,
  });
  const trackedWhatsappHref = trackedContactHref({
    href: whatsapp,
    eventType: "whatsapp_click",
    targetType: "company",
    targetId: company.id,
    path: companyPath,
    category: company.category,
    city: company.city,
  });
  const verificationLabel =
    company.verification_status === "verified" ? "Verified Company" : "Verification Pending";

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <PageNavigation backHref="/professionals" backLabel="Professionals" />

        <section className="mt-5 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  {company.logo_url ? (
                    <ProfilePhotoViewer
                      src={company.logo_url}
                      alt={`${company.company_name} logo`}
                      width={96}
                      height={96}
                      priority
                      buttonClassName="size-20 rounded-2xl border bg-muted sm:size-24"
                      imageClassName="size-20 rounded-2xl sm:size-24"
                      overlayLabel="View logo"
                    />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-2xl border bg-muted text-primary sm:size-24">
                      <Building2 className="size-9" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="gap-1 bg-primary text-primary-foreground">
                      <Building2 className="size-3" aria-hidden="true" />
                      Company
                    </Badge>
                    {company.verification_status === "verified" ? (
                      <Badge variant="outline">
                        <BadgeCheck className="size-3" aria-hidden="true" />
                        Verified Company
                      </Badge>
                    ) : (
                      <Badge variant="outline">{verificationLabel}</Badge>
                    )}
                    {subscription ? (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="size-3" aria-hidden="true" />
                        Active Package
                      </Badge>
                    ) : null}
                  </div>
                  <h1 className="mt-3 truncate text-3xl font-bold tracking-normal sm:text-4xl">
                    {company.company_name}
                  </h1>
                  <p className="mt-1 text-lg font-semibold text-primary">
                    {company.category}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" aria-hidden="true" />
                    {company.city}{company.area ? `, ${company.area}` : ""}
                  </p>
                </div>
              </div>

              {company.description ? (
                <p className="mt-5 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {company.description}
                </p>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border bg-background p-3">
                  <Users className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-xl font-bold">{staffListings.length}</p>
                  <p className="text-xs text-muted-foreground">Staff profiles</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <BriefcaseBusiness className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-xl font-bold">{categories.length}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <Sparkles className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-xl font-bold">{featuredCount}</p>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-sm font-bold capitalize">{company.verification_status}</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>
            </div>

            <aside className="border-t bg-secondary/40 p-5 sm:p-7 lg:border-l lg:border-t-0">
              <h2 className="text-xl font-semibold">Contact company</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Contact directly for staff availability, rates, and service areas.
              </p>
              <div className="mt-5 grid gap-2">
                <ContactActionButton
                  href={trackedPhoneHref}
                  displayValue={company.phone}
                  type="call"
                  className="h-12 justify-start bg-white"
                  variant="outline"
                />
                <ContactActionButton
                  href={trackedWhatsappHref}
                  displayValue={company.whatsapp}
                  type="whatsapp"
                  className="h-12 justify-start bg-[#25d366] text-white hover:bg-[#21bd5b]"
                />
                <Button asChild variant="outline" className="h-12 justify-start bg-white">
                  <Link href={`/send-requirement?city=${encodeURIComponent(company.city)}`}>
                    Send Requirement
                  </Link>
                </Button>
              </div>
              <div className="mt-5 rounded-lg border bg-white p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Company details</p>
                <p className="mt-2">Contact: {company.contact_person ?? "Ask company"}</p>
                <p>Service area: {company.city}{company.area ? `, ${company.area}` : ""}</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Company media
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal">
                Photos and videos
              </h2>
            </div>
          </div>
          {media.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item) => (
                <Card key={item.id} className="overflow-hidden bg-white shadow-sm">
                  {item.media_type === "video" ? (
                    <video src={item.url} controls className="aspect-video w-full bg-black" />
                  ) : (
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={item.url}
                        alt={item.caption ?? `${company.company_name} media`}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {item.media_type === "video" ? (
                        <Video className="size-4" aria-hidden="true" />
                      ) : (
                        <ImageIcon className="size-4" aria-hidden="true" />
                      )}
                      {item.caption ?? "Company media"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed bg-background p-5 text-sm text-muted-foreground">
              Company photos and videos will appear here after upload.
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Staff directory
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal">
                Company-managed staff profiles
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Showing {staffCards.length} of {staffListings.length} approved staff profiles.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/professionals?city=${encodeURIComponent(company.city)}`}>
                Browse All Workers
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <Button asChild variant={!query?.serviceGroup && !query?.category ? "default" : "outline"} size="sm">
              <Link href={`/companies/${company.id}`}>All</Link>
            </Button>
            {serviceGroups.map((serviceGroup) => (
              <Button
                key={serviceGroup}
                asChild
                variant={query?.serviceGroup === serviceGroup ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/companies/${company.id}?serviceGroup=${encodeURIComponent(serviceGroup)}`}>
                  {serviceGroup}
                </Link>
              </Button>
            ))}
            {categories.map((category) => (
              <Button
                key={category}
                asChild
                variant={query?.category === category ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/companies/${company.id}?category=${encodeURIComponent(category)}`}>
                  {category}
                </Link>
              </Button>
            ))}
          </div>

          {staffCards.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {staffCards.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  featured={professional.is_featured}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed bg-white p-5 text-sm text-muted-foreground">
              No approved staff found for this filter.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
