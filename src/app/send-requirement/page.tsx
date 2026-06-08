import { CountryPhoneField } from "@/components/country-phone-field";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getBroadcastRecipientCount,
  serviceFromBroadcastQuery,
} from "@/lib/broadcast";
import { getCityOptions } from "@/lib/city-options";
import { getFormDraft } from "@/lib/form-draft";
import { categories } from "@/lib/marketplace-data";

import { submitRequirement } from "./actions";

export const metadata = {
  title: "Send Requirement | Kamker",
  description: "Submit your service requirement for Kamker matching and reviewed outreach.",
};

const urgencyOptions = ["Today", "Within 2 days", "This week", "Flexible"];
const availabilityOptions = ["Full Time", "Part Time Morning", "Part Time Evening"];

const statusMessages = {
  success: "Your requirement has been submitted for review.",
  missing: "Please fill service, city, phone number, urgency, and details.",
  "not-configured": "Supabase is not configured yet.",
  error: "Could not save requirement. Please try again.",
} as const;

type RequirementDraft = {
  service: string;
  city: string;
  area: string;
  availability: string;
  budget: string;
  phone: string;
  whatsapp: string;
  urgency: string;
  details: string;
  errors: string;
};

type SendRequirementPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
    category?: string;
    subcategory?: string;
    service?: string;
    city?: string;
    area?: string;
    source?: string;
  }>;
};

export default async function SendRequirementPage({
  searchParams,
}: SendRequirementPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const draft = await getFormDraft<RequirementDraft>("send_requirement");
  const cityOptions = await getCityOptions();
  const failedFields = new Set((draft.errors ?? "").split(",").filter(Boolean));
  const category = params?.category?.trim() || undefined;
  const subcategory = params?.subcategory?.trim() || undefined;
  const service = params?.service?.trim() || undefined;
  const city = params?.city?.trim() || draft.city;
  const area = params?.area?.trim() || draft.area;
  const source = params?.source?.trim() ?? "";
  const selectedService = serviceFromBroadcastQuery({
    category,
    subcategory,
  });
  const selectedCity = cityOptions.includes(city ?? "") ? city : "";
  const selectedServiceName = selectedService?.name ?? service ?? draft.service;
  const hasBroadcastContext = Boolean(category || subcategory || city || area);
  const recipientCount = hasBroadcastContext
    ? await getBroadcastRecipientCount({
        category,
        subcategory,
        city: selectedCity || undefined,
        area: area || undefined,
      })
    : null;
  const missingRequired = status === "missing";
  const requiredError = (field: string, message: string) =>
    missingRequired && (failedFields.size === 0 || failedFields.has(field))
      ? message
      : undefined;
  const phoneError =
    missingRequired && failedFields.has("phoneInvalid")
      ? "Enter a valid Pakistan mobile number, for example 03001234567."
      : requiredError("phone", "Phone number is required.");
  const whatsappError =
    missingRequired && failedFields.has("whatsappInvalid")
      ? "Enter a valid WhatsApp number or leave it blank."
      : undefined;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref="/categories" backLabel="Categories" />
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Customer request
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-normal">
            Send Requirement
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Describe your need once. Kamker will match it with relevant
            professionals by service, city, area, and availability. Outreach is
            a paid option after review.
          </p>
        </div>

        {hasBroadcastContext ? (
          <Card className="mt-5 border-primary/20 bg-accent text-accent-foreground shadow-sm">
            <CardContent className="p-5">
              <p className="font-semibold">
                Your requirement is prepared for matching professionals in this
                category after Kamker review.
              </p>
              {recipientCount !== null ? (
                <p className="mt-1 text-sm">
                  Estimated matching pool:{" "}
                  {recipientCount > 0
                    ? `${recipientCount.toLocaleString()} professionals`
                    : "professionals will be matched after review"}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-5 border-primary/20 bg-white shadow-sm">
          <CardContent className="p-5 text-sm">
            <p className="font-semibold text-primary">Requirement review</p>
            <p className="mt-1 text-muted-foreground">
              Kamker reviews submitted requirements before any broadcast or
              matching outreach. Paid broadcast messaging requires approval and
              payment setup before professionals are contacted.
            </p>
          </CardContent>
        </Card>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close status message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <form action={submitRequirement} className="grid gap-6">
              <input type="hidden" name="source" value={source} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Service details</p>
                  <p className="mt-1 text-sm text-muted-foreground">Tell Kamker what you need and where.</p>
                </div>
                <SelectField
                  label="Required service"
                  name="service"
                  options={categories.map((category) => category.name)}
                  defaultValue={selectedServiceName}
                  required
                  error={requiredError("service", "Choose a required service.")}
                />
                <SelectField
                  label="City"
                  name="city"
                  options={cityOptions}
                  defaultValue={selectedCity}
                  required
                  error={requiredError("city", "Choose a city.")}
                />
                <FormField label="Area" name="area" defaultValue={area} />
                <SelectField
                  label="Availability"
                  name="availability"
                  options={availabilityOptions}
                  defaultValue={draft.availability}
                />
                <FormField label="Budget optional" name="budget" placeholder="Rs. 5,000" defaultValue={draft.budget} />
                <SelectField
                  label="Urgency"
                  name="urgency"
                  options={urgencyOptions}
                  defaultValue={draft.urgency}
                  required
                  error={requiredError("urgency", "Choose urgency.")}
                />
              </div>

              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Contact</p>
                  <p className="mt-1 text-sm text-muted-foreground">Professionals use this to respond directly.</p>
                </div>
                <FormField
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="0300 1234567"
                  defaultValue={draft.phone}
                  required
                  error={phoneError}
                />
                <CountryPhoneField label="WhatsApp number" name="whatsapp" defaultValue={draft.whatsapp} error={whatsappError} />
              </div>

              <div className="grid gap-4 border-t pt-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Requirement note</p>
                  <p className="mt-1 text-sm text-muted-foreground">Add timing, location, and any preferences.</p>
                </div>
                <TextAreaField
                  label="Details"
                  name="details"
                  placeholder="Explain the service, timing, location, and any preferences."
                  defaultValue={draft.details}
                  required
                  error={requiredError("details", "Requirement details are required.")}
                />
              </div>
              <Button className="h-12 text-base sm:col-span-2">
                Send Requirement
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
