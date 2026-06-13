import Link from "next/link";

import { CountryPhoneField } from "@/components/country-phone-field";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionProfessional } from "@/lib/auth";
import {
  getBroadcastRecipientCount,
  serviceFromBroadcastQuery,
} from "@/lib/broadcast";
import { getCityOptions } from "@/lib/city-options";
import { getFormDraft } from "@/lib/form-draft";
import { categories, serviceGroups } from "@/lib/marketplace-data";
import { workerPostingBlockedStatus } from "@/lib/worker-status";

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
  "pending-worker":
    "Your profile is waiting for admin approval. You can edit your profile, but posting is disabled until approval.",
  "banned-worker":
    "Your profile has been banned. Posting is disabled. Contact Kamker support.",
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
    estimate?: string;
    ref?: string;
  }>;
};

export default async function SendRequirementPage({
  searchParams,
}: SendRequirementPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const draft = await getFormDraft<RequirementDraft>("send_requirement");
  const professional = await getSessionProfessional();
  const blockedWorkerStatus = workerPostingBlockedStatus(professional);
  const cityOptions = await getCityOptions();
  const failedFields = new Set((draft.errors ?? "").split(",").filter(Boolean));
  const category = params?.category?.trim() || undefined;
  const subcategory = params?.subcategory?.trim() || undefined;
  const service = params?.service?.trim() || undefined;
  const city = params?.city?.trim() || draft.city;
  const area = params?.area?.trim() || draft.area;
  const source = params?.source?.trim() ?? "";
  const estimate = params?.estimate?.trim() ?? "";
  const sourceEstimate = /^\d+$/.test(estimate) ? Number(estimate) : null;
  const selectedService = serviceFromBroadcastQuery({
    category,
    subcategory,
  });
  const selectedCity = city ?? "";
  const cityOptionsWithSelected =
    selectedCity && !cityOptions.includes(selectedCity)
      ? [selectedCity, ...cityOptions]
      : cityOptions;
  const serviceGroup = category
    ? serviceGroups.find((group) => group.name === category)
    : null;
  const selectedServiceName =
    subcategory ?? selectedService?.name ?? service ?? category ?? draft.service;
  const hasSelectedService = Boolean(selectedServiceName);
  const serviceOptions = selectedServiceName && !categories.some((item) => item.name === selectedServiceName)
    ? [
        {
          value: selectedServiceName,
          label: serviceGroup
            ? `${selectedServiceName} (all related services)`
            : selectedServiceName,
        },
        ...categories.map((category) => category.name),
      ]
    : categories.map((category) => category.name);
  const hasBroadcastContext = Boolean(category || subcategory || city || area);
  const contextLocation = [area, city].filter(Boolean).join(", ");
  const contextServiceLabel = selectedServiceName || "matching professionals";
  const defaultDetails =
    draft.details ||
    (hasBroadcastContext
      ? `I need ${contextServiceLabel}${contextLocation ? ` in ${contextLocation}` : ""}. Please contact me with availability and rate.`
      : "");
  const recipientCount = hasBroadcastContext
    ? sourceEstimate ??
      await getBroadcastRecipientCount({
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

  if (status === "success") {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <PageNavigation backHref="/categories" backLabel="Categories" />
          <Card className="mt-6 border-sky-200 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Requirement received
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal">
                Your requirement has been submitted
              </h1>
              <p className="mt-3 leading-7 text-muted-foreground">
                Kamker has saved your requirement for review. Professionals are
                not messaged for free automatically. If you want broadcast
                outreach, Kamker will confirm the paid option before sending it
                to matching professionals.
              </p>
              {params?.ref ? (
                <div className="mt-5 rounded-lg border bg-sky-50 px-4 py-3 text-sm">
                  <span className="font-semibold">Reference:</span>{" "}
                  {params.ref.slice(0, 8).toUpperCase()}
                </div>
              ) : null}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button asChild className="h-12">
                  <Link href="/categories">Browse Services</Link>
                </Button>
                <Button asChild variant="outline" className="h-12">
                  <Link href="/send-requirement">Send Another Requirement</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

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
          <Card className="mt-5 border-primary/20 bg-sky-50 text-foreground shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                Requirement context
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {contextServiceLabel}
                {contextLocation ? ` in ${contextLocation}` : ""}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This form was opened from the matching category page. The service,
                city, and area have been filled from that page where available.
              </p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-md border bg-white px-3 py-2">
                  <span className="font-semibold">Service:</span>{" "}
                  {contextServiceLabel}
                </div>
                <div className="rounded-md border bg-white px-3 py-2">
                  <span className="font-semibold">Estimated recipients:</span>{" "}
                  {recipientCount !== null
                    ? `${recipientCount.toLocaleString()} approved profiles`
                    : "Calculated after review"}
                </div>
                {contextLocation ? (
                  <div className="rounded-md border bg-white px-3 py-2 sm:col-span-2">
                    <span className="font-semibold">Location:</span>{" "}
                    {contextLocation}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-5 border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="p-5 text-sm">
            <p className="font-semibold text-amber-950">Paid broadcast notice</p>
            <p className="mt-1 text-muted-foreground">
              Submitting this form saves your requirement for Kamker review.
              Professionals are not contacted for free automatically. Broadcast
              messaging is a paid option after review and confirmation.
            </p>
          </CardContent>
        </Card>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close status message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        {blockedWorkerStatus ? (
          <Card className="mt-5 border-amber-200 bg-amber-50 text-amber-950 shadow-sm">
            <CardContent className="p-5 text-sm font-medium">
              {blockedWorkerStatus === "banned"
                ? "Your profile has been banned. Posting is disabled. Contact Kamker support."
                : "Your profile is waiting for admin approval. You can edit your profile, but posting is disabled until approval."}
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <form action={submitRequirement} className="grid gap-6">
              <input type="hidden" name="source" value={source} />
              {hasBroadcastContext ? (
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                      Quick requirement
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We already know the service from where you clicked. Add
                      only what Kamker needs to contact you and review the request.
                    </p>
                  </div>
                  {hasSelectedService ? (
                    <input type="hidden" name="service" value={selectedServiceName} />
                  ) : (
                    <SelectField
                      label="Required service"
                      name="service"
                      options={serviceOptions}
                      defaultValue={selectedServiceName}
                      required
                      error={requiredError("service", "Choose a required service.")}
                    />
                  )}
                  {selectedCity ? (
                    <input type="hidden" name="city" value={selectedCity} />
                  ) : (
                    <SelectField
                      label="City"
                      name="city"
                      options={cityOptionsWithSelected}
                      defaultValue={selectedCity}
                      required
                      error={requiredError("city", "Choose a city.")}
                    />
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Area optional"
                      name="area"
                      defaultValue={area}
                      placeholder="Model Town, Gulshan, DHA"
                      autoComplete="address-level3"
                    />
                    <SelectField
                      label="Urgency"
                      name="urgency"
                      options={urgencyOptions}
                      defaultValue={draft.urgency}
                      required
                      error={requiredError("urgency", "Choose urgency.")}
                    />
                  </div>
                  <TextAreaField
                    label="What do you need?"
                    name="details"
                    placeholder="Example: Need a driver tomorrow morning in Saddar for pick and drop."
                    defaultValue={defaultDetails}
                    required
                    error={requiredError("details", "Requirement details are required.")}
                  />
                  <details className="rounded-lg border bg-sky-50/50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-primary">
                      Optional: timing and budget
                    </summary>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <SelectField
                        label="Availability"
                        name="availability"
                        options={availabilityOptions}
                        defaultValue={draft.availability}
                      />
                      <FormField
                        label="Budget optional"
                        name="budget"
                        placeholder="Rs. 5,000"
                        defaultValue={draft.budget}
                      />
                    </div>
                  </details>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="text-sm font-semibold uppercase tracking-normal text-primary">Service details</p>
                    <p className="mt-1 text-sm text-muted-foreground">Tell Kamker what you need and where.</p>
                  </div>
                  <SelectField
                    label="Required service"
                    name="service"
                    options={serviceOptions}
                    defaultValue={selectedServiceName}
                    required
                    error={requiredError("service", "Choose a required service.")}
                  />
                  <SelectField
                    label="City"
                    name="city"
                    options={cityOptionsWithSelected}
                    defaultValue={selectedCity}
                    required
                    error={requiredError("city", "Choose a city.")}
                  />
                  <FormField
                    label="Area"
                    name="area"
                    defaultValue={area}
                    placeholder="Model Town, Gulshan, DHA"
                    autoComplete="address-level3"
                  />
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
              )}

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
                  maxLength={16}
                  required
                  error={phoneError}
                />
                <CountryPhoneField label="WhatsApp number" name="whatsapp" defaultValue={draft.whatsapp} error={whatsappError} />
              </div>

              {!hasBroadcastContext ? (
                <div className="grid gap-4 border-t pt-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-normal text-primary">Requirement note</p>
                    <p className="mt-1 text-sm text-muted-foreground">Add timing, location, and any preferences.</p>
                  </div>
                  <TextAreaField
                    label="Details"
                    name="details"
                    placeholder="Explain the service, timing, location, and any preferences."
                    defaultValue={defaultDetails}
                    required
                    error={requiredError("details", "Requirement details are required.")}
                  />
                </div>
              ) : null}
              <Button className="h-12 text-base sm:col-span-2" disabled={Boolean(blockedWorkerStatus)}>
                {blockedWorkerStatus ? "Posting Disabled" : "Send Requirement"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
