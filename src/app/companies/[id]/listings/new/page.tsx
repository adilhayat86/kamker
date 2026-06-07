import Link from "next/link";
import { BriefcaseBusiness, LockKeyhole, PackageCheck } from "lucide-react";

import { CountryPhoneField } from "@/components/country-phone-field";
import { DismissibleCard, DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { PhotoUploadField } from "@/components/photo-upload-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getActiveCompanySubscription,
  getPublishedCompanyListingUsage,
} from "@/lib/company-packages";
import { getCityOptions } from "@/lib/city-options";
import { getFormDraft } from "@/lib/form-draft";
import { getLocalCompanyRecordById } from "@/lib/local-demo-store";
import { categories, serviceGroups } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { createCompanyListing } from "./actions";

export const metadata = {
  title: "Add Company Staff Profile | Kamker",
};

type CompanyListingNewPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    status?:
      | "missing"
      | "not-configured"
      | "company-missing"
      | "no-package"
      | "quota-full"
      | "invalid-photo"
      | "photo-error"
      | "error";
    source?: string;
  }>;
};

const statusMessages = {
  missing: "Please fill staff name/title, service group, profession, city, age, tagline, and description. Age must be between 16 and 80.",
  "not-configured": "Supabase is not configured yet.",
  "company-missing": "Company was not found.",
  "no-package": "An active company package is required before adding staff profiles.",
  "quota-full": "This company has reached the published listing limit for its active package.",
  "invalid-photo": "Please choose a jpg, png, or webp staff photo under 10MB.",
  "photo-error": "Could not upload staff photo. Please try again.",
  error: "Could not save professional. Please try again.",
} as const;

type CompanyStaffDraft = {
  title: string;
  serviceGroup: string;
  category: string;
  city: string;
  area: string;
  tagline: string;
  gender: string;
  age: string;
  availability: string;
  yearsExperience: string;
  hourlyRate: string;
  monthlyRate: string;
  phone: string;
  whatsapp: string;
  description: string;
  errors: string;
};

async function getCompanyName(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    const localCompany = await getLocalCompanyRecordById(companyId);

    return localCompany?.company_name;
  }

  const { data, error } = await supabase
    .from("companies")
    .select("company_name")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load company name", error);
    return null;
  }

  return data?.company_name as string | undefined;
}

export default async function CompanyListingNewPage({
  params,
  searchParams,
}: CompanyListingNewPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const status = query?.status;
  const source = query?.source?.trim() ?? "";
  const statusMessage = status ? statusMessages[status] : null;
  const missingRequired = status === "missing";
  const draft = await getFormDraft<CompanyStaffDraft>(`company_listing_${id}`);
  const failedFields = new Set((draft.errors ?? "").split(",").filter(Boolean));
  const requiredError = (field: string, message: string) =>
    missingRequired && (failedFields.size === 0 || failedFields.has(field))
      ? message
      : undefined;
  const [companyName, activeSubscription, usage, cityOptions] = await Promise.all([
    getCompanyName(id),
    getActiveCompanySubscription(id),
    getPublishedCompanyListingUsage(id),
    getCityOptions(),
  ]);
  const quotaFull = activeSubscription ? usage.published >= activeSubscription.listings_limit : false;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref={`/companies/${id}/dashboard`} backLabel="Company Dashboard" />

        <div className="mt-5">
          <Badge variant="secondary" className="gap-1.5">
            <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
            Company staff profile
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Add Staff Profile</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a company-managed worker profile under {companyName ?? "this company"}. Choose any service group and profession. Published staff profiles count against the active package limit.
          </p>
        </div>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close listing message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        {!activeSubscription ? (
          <DismissibleCard
            className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
            cardContentClassName="p-5"
            contentClassName="flex gap-3"
            closeLabel="Close package warning"
          >
                <LockKeyhole className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-bold">Activate a package first</h2>
                  <p className="mt-2 text-sm leading-6">
                    Companies can add multiple staff profiles after package activation. Clear payment receipts activate automatically through AI review; unclear receipts stay pending for admin review.
                  </p>
                  <Button asChild className="mt-4 h-11 w-full sm:w-auto">
                    <Link href={`/companies/${id}/packages`}>Choose Package</Link>
                  </Button>
                </div>
          </DismissibleCard>
        ) : quotaFull ? (
          <DismissibleCard
            className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
            cardContentClassName="p-5"
            contentClassName="flex gap-3"
            closeLabel="Close quota warning"
          >
                <PackageCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-bold">Published listing limit reached</h2>
                  <p className="mt-2 text-sm leading-6">
                    {usage.published} of {activeSubscription.listings_limit} published listings are already used on {activeSubscription.package_title}. Upgrade or remove old published listings before adding more.
                  </p>
                  <Button asChild className="mt-4 h-11 w-full sm:w-auto" variant="outline">
                    <Link href={`/companies/${id}/dashboard`}>Back to Dashboard</Link>
                  </Button>
                </div>
          </DismissibleCard>
        ) : (
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                Active package: <span className="font-semibold text-foreground">{activeSubscription.package_title}</span> · Published usage: <span className="font-semibold text-foreground">{usage.published}/{activeSubscription.listings_limit}</span> · Featured usage: <span className="font-semibold text-foreground">{usage.featured}/{activeSubscription.featured_limit}</span>
              </div>
              <form action={createCompanyListing} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="companyId" value={id} />
                <input type="hidden" name="source" value={source} />
                <FormField
                  label="Staff name or title"
                  name="title"
                  placeholder="Ali Khan, Home Nurse, Security Guard"
                  defaultValue={draft.title}
                  required
                  error={requiredError("title", "Staff name or title is required.")}
                />
                <SelectField
                  label="Service group"
                  name="serviceGroup"
                  options={serviceGroups.map((group) => group.name)}
                  defaultValue={draft.serviceGroup}
                  required
                  error={requiredError("serviceGroup", "Choose a service group.")}
                />
                <SelectField
                  label="Profession / category"
                  name="category"
                  options={categories.map((category) => category.name)}
                  defaultValue={draft.category}
                  required
                  error={requiredError("category", "Choose a profession/category.")}
                />
                <SelectField
                  label="City"
                  name="city"
                  options={cityOptions}
                  defaultValue={draft.city}
                  required
                  error={requiredError("city", "Choose a city.")}
                />
                <FormField label="Area" name="area" placeholder="DHA, Gulberg, G-10" defaultValue={draft.area} />
                <FormField
                  label="Profile tagline"
                  name="tagline"
                  placeholder="Trusted home nurse"
                  maxLength={30}
                  defaultValue={draft.tagline}
                  required
                  error={requiredError("tagline", "Profile tagline is required and must be 30 characters or less.")}
                />
                <SelectField label="Gender" name="gender" options={["Male", "Female", "Other"]} defaultValue={draft.gender} />
                <FormField
                  label="Age"
                  name="age"
                  type="number"
                  placeholder="28"
                  min={16}
                  max={80}
                  defaultValue={draft.age}
                  required
                  error={requiredError("age", "Enter an age between 16 and 80.")}
                />
                <SelectField label="Availability" name="availability" options={["Full Time", "Part Time", "Day Shift", "Night Shift", "Weekends", "On Call"]} defaultValue={draft.availability} />
                <FormField label="Years experience" name="yearsExperience" type="number" placeholder="5" defaultValue={draft.yearsExperience} />
                <FormField label="Hourly rate optional" name="hourlyRate" type="number" placeholder="500" defaultValue={draft.hourlyRate} />
                <FormField label="Monthly rate optional" name="monthlyRate" type="number" placeholder="45000" defaultValue={draft.monthlyRate} />
                <PhotoUploadField
                  label="Staff profile photo"
                  helpText="Choose a photo from phone gallery. Large images are compressed before upload."
                  uploadFolder="company-staff"
                  uploadTags={["company-staff-photo"]}
                />
                <FormField label="Phone optional" name="phone" type="tel" defaultValue={draft.phone} />
                <CountryPhoneField label="WhatsApp optional" name="whatsapp" defaultValue={draft.whatsapp} />
                <div className="sm:col-span-2">
                  <TextAreaField
                    label="Staff profile details"
                    name="description"
                    placeholder="Describe experience, timings, areas covered, duties, and any requirements."
                    defaultValue={draft.description}
                    required
                    error={requiredError("description", "Staff profile details are required.")}
                  />
                </div>
                <Button className="h-12 sm:col-span-2">Publish Staff Profile</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
