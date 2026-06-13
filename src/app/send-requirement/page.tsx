import Link from "next/link";
import { redirect } from "next/navigation";

import { CountryPhoneField } from "@/components/country-phone-field";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField } from "@/components/form-field";
import { LimitedTextAreaField } from "@/components/limited-textarea-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import {
  getBroadcastRecipientCount,
  serviceFromBroadcastQuery,
} from "@/lib/broadcast";
import { getCityOptions } from "@/lib/city-options";
import { getFormDraft } from "@/lib/form-draft";
import { categories, serviceGroups } from "@/lib/marketplace-data";
import {
  calculateRequirementBroadcastAmountPkr,
  REQUIREMENT_BROADCAST_AMOUNT_PKR,
  REQUIREMENT_DETAILS_MAX_LENGTH,
} from "@/lib/requirement-broadcast";
import { workerPostingBlockedStatus } from "@/lib/worker-status";

import { submitRequirement } from "./actions";

export const metadata = {
  title: "Send Requirement | Kamker",
  description: "Submit a paid Kamker requirement broadcast to matching professionals.",
};

const statusMessages = {
  success: "Your requirement has been saved.",
  missing: "Please fill service, city, phone number, and a short requirement message.",
  "not-configured": "Supabase is not configured yet.",
  "customer-registered": "Customer account created. You can now send your requirement.",
  "banned-worker":
    "Your profile has been banned. Posting is disabled. Contact Kamker support.",
  error: "Could not save requirement. Please try again.",
} as const;

type RequirementDraft = {
  service: string;
  city: string;
  area: string;
  phone: string;
  whatsapp: string;
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
  const [professional, customer] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
  ]);

  if (!professional && !customer) {
    const nextParams = new URLSearchParams();
    (
      [
        "category",
        "subcategory",
        "service",
        "city",
        "area",
        "source",
        "estimate",
      ] as const
    ).forEach((key) => {
      const value = params?.[key];
      if (value) {
        nextParams.set(key, value);
      }
    });
    const nextPath = `/send-requirement${nextParams.size ? `?${nextParams.toString()}` : ""}`;
    redirect(`/login?status=login-required&next=${encodeURIComponent(nextPath)}`);
  }

  const blockedWorkerStatus = workerPostingBlockedStatus(professional);
  const cityOptions = await getCityOptions();
  const failedFields = new Set((draft.errors ?? "").split(",").filter(Boolean));
  const category = params?.category?.trim() || undefined;
  const subcategory = params?.subcategory?.trim() || undefined;
  const service = params?.service?.trim() || undefined;
  const accountPhone = professional?.phone_number ?? customer?.phone_number ?? "";
  const accountWhatsapp = professional?.whatsapp_number ?? "";
  const accountCity = professional?.cities?.name ?? customer?.cities?.name ?? "";
  const queryCity = params?.city?.trim() || "";
  const queryArea = params?.area?.trim() || "";
  const city = queryCity || draft.city || accountCity;
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
  const hasUrlServiceContext = Boolean(category || subcategory || service);
  const hasUrlLocationContext = Boolean(queryCity || queryArea);
  const hasBroadcastContext = hasUrlServiceContext || hasUrlLocationContext;
  const contextLocation = [queryArea, queryCity].filter(Boolean).join(", ");
  const contextServiceLabel = selectedServiceName || "";
  const contextTitle = contextServiceLabel
    ? `${contextServiceLabel}${contextLocation ? ` in ${contextLocation}` : ""}`
    : contextLocation
      ? `Professionals in ${contextLocation}`
      : "Matching professionals";
  const defaultDetails =
    draft.details ||
    (hasBroadcastContext
      ? `I need ${contextServiceLabel || "a professional"}${contextLocation ? ` in ${contextLocation}` : ""}.`
      : "");
  const recipientCount = hasBroadcastContext
    ? sourceEstimate ??
      await getBroadcastRecipientCount({
        category,
        subcategory,
        city: queryCity || undefined,
        area: queryArea || undefined,
      })
    : null;
  const estimatedBroadcastTotal =
    typeof recipientCount === "number"
      ? calculateRequirementBroadcastAmountPkr(recipientCount)
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
  const detailsError =
    missingRequired && failedFields.has("detailsTooLong")
      ? `Keep this under ${REQUIREMENT_DETAILS_MAX_LENGTH.toLocaleString("en-PK")} characters so it can be sent on WhatsApp.`
      : requiredError("details", "Tell Kamker what you need.");

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
                Kamker saved your requirement. Continue to the payment proof
                step from the latest requirement link to start broadcast
                messaging.
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
            Describe your need once. Kamker matches it with relevant
            professionals by service and city.
          </p>
        </div>

        {hasBroadcastContext ? (
          <Card className="mt-5 border-primary/20 bg-sky-50 text-foreground shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                Requirement context
              </p>
              <h2 className="mt-1 text-xl font-bold">{contextTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This form was opened from the matching category page. The service,
                city, and any hidden area context have been filled from that page where available.
              </p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                {contextServiceLabel ? (
                  <div className="rounded-md border bg-white px-3 py-2">
                    <span className="font-semibold">Service:</span>{" "}
                    {contextServiceLabel}
                  </div>
                ) : null}
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

        <Card className="mt-5 border-sky-200 bg-sky-50 shadow-sm">
          <CardContent className="p-5 text-sm">
            <p className="font-semibold text-foreground">
              Paid broadcast: Rs {REQUIREMENT_BROADCAST_AMOUNT_PKR} per professional
            </p>
            {estimatedBroadcastTotal !== null ? (
              <div className="mt-3 rounded-lg border border-primary/20 bg-white px-4 py-3">
                <p className="font-semibold text-foreground">
                  Rs {REQUIREMENT_BROADCAST_AMOUNT_PKR} x{" "}
                  {recipientCount?.toLocaleString("en-PK")} recipient
                  {recipientCount === 1 ? "" : "s"} = Rs{" "}
                  {estimatedBroadcastTotal.toLocaleString("en-PK")} total cost
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Final payable amount is confirmed again after Kamker creates
                  the exact recipient match list.
                </p>
              </div>
            ) : null}
            <p className="mt-3 text-muted-foreground">
              Matching professionals are contacted after payment proof is
              approved. Clear receipts can be approved automatically.
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
              <input type="hidden" name="categoryContext" value={category ?? ""} />
              <input type="hidden" name="subcategoryContext" value={subcategory ?? ""} />
              <input type="hidden" name="estimate" value={estimate} />
              {queryArea ? <input type="hidden" name="area" value={queryArea} /> : null}

              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                    Paid broadcast details
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep it short. Kamker will send this to the matched professionals after payment approval.
                  </p>
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
                <LimitedTextAreaField
                  label="What do you need?"
                  name="details"
                  placeholder="Example: Need a maid today for house cleaning."
                  defaultValue={defaultDetails}
                  maxLength={REQUIREMENT_DETAILS_MAX_LENGTH}
                  required
                  helperText="This message is sent through WhatsApp, so keep it clear and direct."
                  error={detailsError}
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
                  defaultValue={draft.phone || accountPhone}
                  maxLength={16}
                  required
                  error={phoneError}
                />
                <CountryPhoneField label="WhatsApp number" name="whatsapp" defaultValue={draft.whatsapp || accountWhatsapp} error={whatsappError} />
              </div>

              <Button className="h-12 text-base sm:col-span-2" disabled={blockedWorkerStatus === "banned"}>
                {blockedWorkerStatus === "banned" ? "Requirement Disabled" : "Continue to Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
