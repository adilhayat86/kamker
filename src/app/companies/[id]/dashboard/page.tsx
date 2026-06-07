import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  ExternalLink,
  ImageIcon,
  ListChecks,
  PackageCheck,
  PlusCircle,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getActiveCompanySubscription,
  getPublishedCompanyListingUsage,
} from "@/lib/company-packages";
import {
  getLocalCompanyListingRecords,
  getLocalCompanyRecordById,
} from "@/lib/local-demo-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { addCompanyMedia, updateCompanyLogo } from "./actions";

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
  logo_url: string | null;
};

type CompanyListing = {
  id: string;
  title: string;
  category: string;
  city: string;
  area: string | null;
  description: string | null;
  age: number | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  is_featured: boolean;
  phone: string | null;
  whatsapp: string | null;
  status: string;
};

type CompanyMedia = {
  id: string;
  url: string;
  media_type: "image" | "video";
  caption: string | null;
  sort_order: number | null;
};

type CompanyDashboardPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    status?:
      | "logo-updated"
      | "media-added"
      | "missing-media"
      | "invalid-media"
      | "media-error"
      | "not-configured"
      | "local-listing-added"
      | "package-active"
      | "payment-under-review";
  }>;
};

const statusMessages = {
  "logo-updated": "Company logo updated.",
  "media-added": "Company media added to the public profile.",
  "missing-media": "Please choose a logo, image, or video file.",
  "invalid-media": "Upload jpg, png, or webp images under 2MB, or mp4/webm videos under 20MB.",
  "media-error": "Could not save company media. Please try again.",
  "not-configured": "Supabase is not configured yet.",
  "local-listing-added": "Local demo professional added to this company.",
  "package-active": "Payment approved by AI. Your package is active and you can add staff profiles now.",
  "payment-under-review": "Receipt uploaded. AI could not safely verify it, so payment is under review. You can still complete your company profile while waiting.",
} as const;

async function getCompany(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    const localCompany = await getLocalCompanyRecordById(companyId);

    if (localCompany) {
      return localCompany satisfies Company;
    }

    return null;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id, company_name, category, city, area, contact_person, phone, whatsapp, description, verification_status, logo_url")
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
    const localListings = await getLocalCompanyListingRecords(companyId);

    return localListings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      category: listing.category,
      city: listing.city,
      area: listing.area,
      description: listing.description,
      age: listing.age,
      hourly_rate: listing.hourly_rate,
      monthly_rate: listing.monthly_rate,
      is_featured: listing.is_featured,
      phone: listing.phone,
      whatsapp: listing.whatsapp,
      status: listing.status,
    })) satisfies CompanyListing[];
  }

  const { data, error } = await supabase
    .from("company_listings")
    .select("id, title, category, city, area, description, age, hourly_rate, monthly_rate, is_featured, phone, whatsapp, status")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load company listings", error);
    return [] as CompanyListing[];
  }

  return (data ?? []) as CompanyListing[];
}

async function getCompanyMedia(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CompanyMedia[];
  }

  const { data, error } = await supabase
    .from("company_media")
    .select("id, url, media_type, caption, sort_order")
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

export default async function CompanyDashboardPage({
  params,
  searchParams,
}: CompanyDashboardPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const status = query?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const [company, listings, activeSubscription, usage, media] = await Promise.all([
    getCompany(id),
    getCompanyListings(id),
    getActiveCompanySubscription(id),
    getPublishedCompanyListingUsage(id),
    getCompanyMedia(id),
  ]);

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

  const canAddProfessional = Boolean(activeSubscription) && (
    !activeSubscription || usage.published < activeSubscription.listings_limit
  );
  const staffActionLabel = activeSubscription
    ? usage.published >= activeSubscription.listings_limit
      ? "Package Limit Reached"
      : "Add Staff Profile"
    : "Package Required";

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
              Manage company details and staff profiles from one place.
            </p>
          </div>
          <Button
            asChild={canAddProfessional}
            variant={canAddProfessional ? "default" : "outline"}
            className="h-12 w-full sm:w-auto"
            disabled={!canAddProfessional}
          >
            {canAddProfessional ? (
              <Link href={`/companies/${company.id}/listings/new`}>
                <PlusCircle className="size-4" aria-hidden="true" />
                {staffActionLabel}
              </Link>
            ) : (
              <span>
              <PlusCircle className="size-4" aria-hidden="true" />
                {staffActionLabel}
              </span>
            )}
          </Button>
        </div>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close company profile message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        {!activeSubscription ? (
          <Card className="mt-5 border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="grid gap-3 p-4 text-sm leading-6 text-amber-950 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Package activation needed</p>
                <p className="mt-1">
                  Choose a package and upload payment proof. Clear receipts activate automatically through AI review.
                </p>
              </div>
              <Button asChild variant="outline" className="h-11 shrink-0 bg-white">
                <Link href={`/companies/${company.id}/packages`}>
                  Choose Package
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <ListChecks className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-4 text-2xl font-bold">{usage.published}</p>
              <p className="mt-1 text-sm text-muted-foreground">Published professionals</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <Building2 className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-4 text-2xl font-bold capitalize">{company.verification_status}</p>
              <p className="mt-1 text-sm text-muted-foreground">Verification status</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <PackageCheck className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-4 text-2xl font-bold">
                {activeSubscription ? `${usage.published}/${activeSubscription.listings_limit}` : "No package"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeSubscription ? activeSubscription.package_title : "Package needed"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <Sparkles className="size-6 text-primary" aria-hidden="true" />
              <p className="mt-4 text-2xl font-bold">
                {activeSubscription ? `${usage.featured}/${activeSubscription.featured_limit}` : "0/0"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Featured published</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Company Profile</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Public profile with logo, gallery, video, and approved staff.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={`/companies/${company.id}`}>
                  <ExternalLink className="size-4" aria-hidden="true" />
                  View Public Profile
                </Link>
              </Button>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
              <div>
                <div className="relative size-32 overflow-hidden rounded-2xl border bg-muted">
                  {company.logo_url ? (
                    <Image
                      src={company.logo_url}
                      alt={`${company.company_name} logo`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Building2 className="size-10" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <form action={updateCompanyLogo} className="mt-3 grid gap-2">
                  <input type="hidden" name="companyId" value={company.id} />
                  <input
                    name="logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  />
                  <Button className="h-10" variant="outline">
                    <Upload className="size-4" aria-hidden="true" />
                    Upload Logo
                  </Button>
                </form>
              </div>
              <div>
                <form action={addCompanyMedia} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <input type="hidden" name="companyId" value={company.id} />
                  <label className="grid gap-1">
                    <span className="text-sm font-medium">Gallery image or video</span>
                    <input
                      name="media"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm font-medium">Caption optional</span>
                    <input
                      name="caption"
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Office, team, training, service area"
                    />
                  </label>
                  <Button className="h-10 self-end">
                    <Upload className="size-4" aria-hidden="true" />
                    Add Media
                  </Button>
                </form>
                <p className="mt-2 text-xs text-muted-foreground">
                  Images: jpg/png/webp under 2MB. Videos: mp4/webm under 20MB.
                </p>
                {media.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {media.map((item) => (
                      <div key={item.id} className="overflow-hidden rounded-lg border bg-white">
                        {item.media_type === "video" ? (
                          <video src={item.url} controls className="aspect-video w-full bg-black" />
                        ) : (
                          <div className="relative aspect-video bg-muted">
                            <Image
                              src={item.url}
                              alt={item.caption ?? `${company.company_name} media`}
                              fill
                              sizes="(min-width: 1024px) 240px, 50vw"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className="flex items-center gap-1.5 p-2 text-xs text-muted-foreground">
                          {item.media_type === "video" ? (
                            <Video className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ImageIcon className="size-3.5" aria-hidden="true" />
                          )}
                          {item.caption ?? "Company media"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No profile media yet. Add images or a short video for customers to trust the company.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold">Package access</h2>
            {activeSubscription ? (
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <span>Package: {activeSubscription.package_title}</span>
                <span>Published: {usage.published}/{activeSubscription.listings_limit}</span>
                <span>Featured: {usage.featured}/{activeSubscription.featured_limit}</span>
                <span>Expires: {new Date(activeSubscription.expires_at).toLocaleDateString("en-PK")}</span>
              </div>
            ) : (
              <DismissibleNotice className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" closeLabel="Close package warning">
                <p className="font-semibold">No active package</p>
              <p className="mt-1">Choose and activate a package before adding company-managed staff profiles.</p>
                <Button asChild className="mt-4 h-11 w-full sm:w-auto">
                  <Link href={`/companies/${company.id}/packages`}>Choose Package</Link>
                </Button>
              </DismissibleNotice>
            )}
          </CardContent>
        </Card>

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
                <h2 className="text-xl font-semibold">Professionals</h2>
                <p className="mt-1 text-sm text-muted-foreground">Add worker profiles owned by this company account.</p>
              </div>
              <Button asChild={canAddProfessional} variant="outline" className="w-full sm:w-auto" disabled={!canAddProfessional}>
                {canAddProfessional ? (
                  <Link href={`/companies/${company.id}/listings/new`}>Add Staff Profile</Link>
                ) : (
                  <span>Add Staff Profile</span>
                )}
              </Button>
            </div>

            {listings.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {listings.map((listing) => (
                  <div key={listing.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{listing.title}</p>
                      <Badge variant="outline">{listing.status}</Badge>
                      {listing.is_featured ? <Badge>Featured</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {listing.category} · {listing.city}{listing.area ? ` · ${listing.area}` : ""}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                      <span>Hourly: {listing.hourly_rate ? `Rs ${listing.hourly_rate}` : "Not provided"}</span>
                      <span>Monthly: {listing.monthly_rate ? `Rs ${listing.monthly_rate}` : "Not provided"}</span>
                      <span>Age: {listing.age ?? "Not added"}</span>
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
