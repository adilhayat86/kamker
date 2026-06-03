import { BriefcaseBusiness } from "lucide-react";

import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categories, cities } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { createCompanyListing } from "./actions";

export const metadata = {
  title: "Add Company Listing | Kamker",
};

type CompanyListingNewPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ status?: "missing" | "not-configured" | "company-missing" | "error" }>;
};

const statusMessages = {
  missing: "Please fill title, category, city, and description.",
  "not-configured": "Supabase is not configured yet.",
  "company-missing": "Company was not found.",
  error: "Could not save listing. Please try again.",
} as const;

async function getCompanyName(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
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
  const statusMessage = status ? statusMessages[status] : null;
  const companyName = await getCompanyName(id);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref={`/companies/${id}/dashboard`} backLabel="Company Dashboard" />

        <div className="mt-5">
          <Badge variant="secondary" className="gap-1.5">
            <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
            Company listing
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Add Listing</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add a staff member or service under {companyName ?? "this company"}. Listings are saved for review before public display.
          </p>
        </div>

        {statusMessage ? (
          <div className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium">
            {statusMessage}
          </div>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <form action={createCompanyListing} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="companyId" value={id} />
              <FormField label="Listing title" name="title" placeholder="Security Guard, Home Nurse, Office Cleaner" />
              <SelectField label="Category" name="category" options={categories.map((category) => category.name)} />
              <SelectField label="City" name="city" options={cities} />
              <FormField label="Area" name="area" placeholder="DHA, Gulberg, G-10" />
              <FormField label="Hourly rate optional" name="hourlyRate" type="number" placeholder="500" />
              <FormField label="Monthly rate optional" name="monthlyRate" type="number" placeholder="45000" />
              <FormField label="Phone optional" name="phone" type="tel" />
              <FormField label="WhatsApp optional" name="whatsapp" type="tel" />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Description"
                  name="description"
                  placeholder="Describe experience, timings, areas covered, duties, and any requirements."
                />
              </div>
              <Button className="h-12 sm:col-span-2">Save Listing</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
