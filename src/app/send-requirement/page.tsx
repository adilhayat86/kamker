import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getBroadcastRecipientCount,
  serviceFromBroadcastQuery,
} from "@/lib/broadcast";
import { categories, cities } from "@/lib/marketplace-data";

import { submitRequirement } from "./actions";

export const metadata = {
  title: "Send Requirement | Kamker",
  description: "Send your service requirement to matching Kamker professionals.",
};

const urgencyOptions = ["Today", "Within 2 days", "This week", "Flexible"];
const availabilityOptions = ["Full Time", "Part Time Morning", "Part Time Evening"];

const statusMessages = {
  success: "Your requirement has been submitted for review.",
  missing: "Please fill service, city, phone number, urgency, and details.",
  "not-configured": "Supabase is not configured yet.",
  error: "Could not save requirement. Please try again.",
} as const;

type SendRequirementPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
    category?: string;
    subcategory?: string;
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
  const category = params?.category?.trim() || undefined;
  const subcategory = params?.subcategory?.trim() || undefined;
  const city = params?.city?.trim();
  const area = params?.area?.trim();
  const source = params?.source?.trim() ?? "";
  const selectedService = serviceFromBroadcastQuery({
    category,
    subcategory,
  });
  const selectedCity = cities.includes(city ?? "") ? city : "";
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
  const requiredError = (message: string) =>
    missingRequired ? message : undefined;

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
            professionals by service, city, area, and availability.
          </p>
        </div>

        {hasBroadcastContext ? (
          <Card className="mt-5 border-primary/20 bg-accent text-accent-foreground shadow-sm">
            <CardContent className="p-5">
              <p className="font-semibold">
                Your requirement will be sent to matching professionals in this
                category.
              </p>
              {recipientCount !== null ? (
                <p className="mt-1 text-sm">
                  Estimated recipients: {recipientCount.toLocaleString()}{" "}
                  professionals
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
              matching outreach. Broadcast messaging requires approval and
              payment setup.
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
                  defaultValue={selectedService?.name}
                  required
                  error={requiredError("Choose a required service.")}
                />
                <SelectField
                  label="City"
                  name="city"
                  options={cities}
                  defaultValue={selectedCity}
                  required
                  error={requiredError("Choose a city.")}
                />
                <FormField label="Area" name="area" defaultValue={area} />
                <SelectField
                  label="Availability"
                  name="availability"
                  options={availabilityOptions}
                />
                <FormField label="Budget optional" name="budget" placeholder="Rs. 5,000" />
                <SelectField
                  label="Urgency"
                  name="urgency"
                  options={urgencyOptions}
                  required
                  error={requiredError("Choose urgency.")}
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
                  required
                  error={requiredError("Phone number is required.")}
                />
                <FormField label="WhatsApp number" name="whatsapp" type="tel" />
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
                  required
                  error={requiredError("Requirement details are required.")}
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
