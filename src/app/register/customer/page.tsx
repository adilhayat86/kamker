import Link from "next/link";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCityOptions } from "@/lib/city-options";
import { getFormDraft } from "@/lib/form-draft";

import { registerCustomer } from "./actions";

export const metadata = {
  title: "Register as Customer | Kamker",
};

const statusMessages = {
  success: "Customer profile submitted successfully. You can now browse categories and contact workers directly.",
  missing: "Fix the highlighted fields. Your entered customer details are kept so you can correct them easily.",
  "not-configured": "Supabase is not configured yet.",
  duplicate: "This phone number already has a customer account. Please log in instead.",
  "customer-registered": "Customer account created. You can now send your requirement.",
  error: "Could not register customer. Please try again.",
} as const;

type CustomerRegisterPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
    next?: string;
  }>;
};

type CustomerDraft = {
  fullName: string;
  phone: string;
  city: string;
  area: string;
  errors: string;
};

export default async function CustomerRegisterPage({
  searchParams,
}: CustomerRegisterPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const next = params?.next?.startsWith("/") && !params.next.startsWith("//")
    ? params.next
    : "";
  const draft = await getFormDraft<CustomerDraft>("customer");
  const cityOptions = await getCityOptions();
  const failedFields = new Set((draft.errors ?? "").split(",").filter(Boolean));
  const errorFor = (field: string) => {
    const phoneError = field === "phone" && failedFields.has("phoneInvalid");

    if (!failedFields.has(field) && !phoneError) {
      return undefined;
    }

    const messages: Record<string, string> = {
      fullName: "Full name is required.",
      phone: "Phone number is required.",
      phoneInvalid: "Enter a valid Pakistan mobile number, for example 03001234567.",
      city: "Choose a city.",
      password: "Password must be at least 6 characters.",
    };

    if (field === "phone" && failedFields.has("phoneInvalid")) {
      return messages.phoneInvalid;
    }

    return messages[field] ?? "This field needs attention.";
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl">
        <PageNavigation backHref="/register" backLabel="Register" />
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Register as Customer
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Save your contact details once, then send paid requirements faster.
          Browsing workers and categories remains public.
        </p>
        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close registration message">
            {statusMessage}
            {status === "success" ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button asChild>
                  <Link href="/categories">Browse Categories</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/professionals">View Workers</Link>
                </Button>
              </div>
            ) : null}
          </DismissibleNotice>
        ) : null}
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <form action={registerCustomer} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="next" value={next} />
              <FormField
                label="Full name"
                name="fullName"
                defaultValue={draft.fullName}
                error={errorFor("fullName")}
                required
              />
              <FormField
                label="Phone number"
                name="phone"
                type="tel"
                placeholder="0300 1234567"
                defaultValue={draft.phone}
                error={errorFor("phone")}
                maxLength={16}
                required
              />
              <SelectField
                label="City"
                name="city"
                options={cityOptions}
                defaultValue={draft.city}
                error={errorFor("city")}
                required
              />
              <FormField label="Area" name="area" defaultValue={draft.area} />
              <FormField
                label="Password"
                name="password"
                type="password"
                autoComplete="new-password"
                error={errorFor("password")}
                helperText="Use at least 6 characters. You will use this to send future requirements."
                required
              />
              <Button className="h-12 sm:col-span-2">Register</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
