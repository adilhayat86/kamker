import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFormDraft } from "@/lib/form-draft";
import { cities } from "@/lib/marketplace-data";

import { registerCustomer } from "./actions";

export const metadata = {
  title: "Register as Customer | Kamker",
};

const statusMessages = {
  success: "Customer profile submitted successfully.",
  missing: "Please fill name, phone, and city.",
  "not-configured": "Supabase is not configured yet.",
  error: "Could not register customer. Please try again.",
} as const;

type CustomerRegisterPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

type CustomerDraft = {
  fullName: string;
  phone: string;
  city: string;
  area: string;
};

export default async function CustomerRegisterPage({
  searchParams,
}: CustomerRegisterPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const draft = await getFormDraft<CustomerDraft>("customer");

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl">
        <PageNavigation backHref="/register" backLabel="Register" />
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Register as Customer
        </h1>
        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close registration message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <form action={registerCustomer} className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" name="fullName" defaultValue={draft.fullName} />
              <FormField label="Phone number" name="phone" type="tel" defaultValue={draft.phone} />
              <SelectField label="City" name="city" options={cities} defaultValue={draft.city} />
              <FormField label="Area" name="area" defaultValue={draft.area} />
              <Button className="h-12 sm:col-span-2">Register</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
