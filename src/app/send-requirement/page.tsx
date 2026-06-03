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
  success: "Your requirement has been saved.",
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

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref="/categories" backLabel="Categories" />
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Send Requirement
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your need and receive responses from matching professionals.
        </p>

        {hasBroadcastContext ? (
          <Card className="mt-5 border-primary/20 bg-accent text-accent-foreground shadow-sm">
            <CardContent className="p-4">
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
            <p className="font-semibold text-primary">Free mode</p>
            <p className="mt-1 text-muted-foreground">
              Your requirement is saved so Kamker can review and organize it.
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
            <p className="font-semibold text-primary">Paid broadcast later</p>
            <p className="mt-1 text-muted-foreground">
              Message all matching professionals by service, city, and area.
            </p>
          </div>
        </div>

        {statusMessage ? (
          <div className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium">
            {statusMessage}
          </div>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <form action={submitRequirement} className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Required service"
                name="service"
                options={categories.map((category) => category.name)}
                defaultValue={selectedService?.name}
              />
              <SelectField
                label="City"
                name="city"
                options={cities}
                defaultValue={selectedCity}
              />
              <FormField label="Area" name="area" defaultValue={area} />
              <SelectField
                label="Availability"
                name="availability"
                options={availabilityOptions}
              />
              <FormField label="Budget optional" name="budget" placeholder="Rs. 5,000" />
              <FormField label="Phone number" name="phone" type="tel" />
              <FormField label="WhatsApp number" name="whatsapp" type="tel" />
              <SelectField label="Urgency" name="urgency" options={urgencyOptions} />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Details"
                  name="details"
                  placeholder="Explain the service, timing, location, and any preferences."
                />
              </div>
              <Button className="h-12 sm:col-span-2">Send Requirement</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
