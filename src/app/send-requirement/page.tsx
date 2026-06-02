import Link from "next/link";

import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categories, cities } from "@/lib/marketplace-data";

import { submitRequirement } from "./actions";

export const metadata = {
  title: "Send Requirement | Kamker",
  description: "Send your service requirement to matching Kamker professionals.",
};

const urgencyOptions = ["Today", "Within 2 days", "This week", "Flexible"];

const statusMessages = {
  success: "Your requirement has been saved.",
  missing: "Please fill service, city, phone number, urgency, and details.",
  "not-configured": "Supabase is not configured yet.",
  error: "Could not save requirement. Please try again.",
} as const;

type SendRequirementPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

export default async function SendRequirementPage({
  searchParams,
}: SendRequirementPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-primary">
          Kamker
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Send Requirement
        </h1>
        <p className="mt-2 text-muted-foreground">
          Describe your need and receive responses from matching professionals.
        </p>
        <p className="mt-2 text-sm font-medium text-primary">
          Paid broadcast to matching professionals can be enabled later.
        </p>

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
              />
              <SelectField label="City" name="city" options={cities} />
              <FormField label="Area" name="area" />
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
