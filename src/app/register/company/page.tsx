import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

import { CountryPhoneField } from "@/components/country-phone-field";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCityOptions } from "@/lib/city-options";
import { getFormDraft } from "@/lib/form-draft";
import { categories } from "@/lib/marketplace-data";

import { registerCompany } from "./actions";

export const metadata = {
  title: "Register Company | Kamker",
  description: "Register a company account to add multiple staff profiles on Kamker.",
};

const statusMessages = {
  success:
    "Company details saved. Next step is choosing a package for company-managed staff profiles.",
  missing:
    "Fix the highlighted fields. Your entered company details are kept so you can correct them easily.",
  "not-configured": "Supabase is not configured yet.",
  error: "Could not register company. Please try again.",
} as const;

const companyCategories = [
  "Security Company",
  "Bodyguard Service",
  "Cleaning Company",
  "Maid Agency",
  "Nursing Agency",
  "Driver Company",
  "Tutor Academy",
  "Construction Contractor",
  "Home Repair Company",
  "Beauty/Event Company",
  "Fire Safety Trainer",
  "Licensed Firearm Safety Trainer",
  ...categories.map((category) => category.name),
];

type CompanyRegisterPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
    companyId?: string;
  }>;
};

type CompanyDraft = {
  companyName: string;
  category: string;
  city: string;
  area: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  licenseNumber: string;
  description: string;
  errors: string;
};

export default async function CompanyRegisterPage({
  searchParams,
}: CompanyRegisterPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const companyId = params?.companyId;
  const statusMessage = status ? statusMessages[status] : null;
  const draft = await getFormDraft<CompanyDraft>("company");
  const cityOptions = await getCityOptions();
  const failedFields = new Set((draft.errors ?? "").split(",").filter(Boolean));
  const errorFor = (field: string) => {
    const phoneError = field === "phone" && failedFields.has("phoneInvalid");
    const whatsappError = field === "whatsapp" && failedFields.has("whatsappInvalid");

    if (!failedFields.has(field) && !phoneError && !whatsappError) {
      return undefined;
    }

    const messages: Record<string, string> = {
      companyName: "Company name is required.",
      category: "Choose a company category.",
      city: "Choose a city.",
      contactPerson: "Contact person is required.",
      phone: "Phone number is required.",
      phoneInvalid: "Enter a valid Pakistan mobile number, for example 03001234567.",
      whatsappInvalid: "Enter a valid WhatsApp number or leave it blank.",
      description: "Company description is required.",
    };

    if (field === "phone" && failedFields.has("phoneInvalid")) {
      return messages.phoneInvalid;
    }

    if (field === "whatsapp" && failedFields.has("whatsappInvalid")) {
      return messages.whatsappInvalid;
    }

    return messages[field] ?? "This field needs attention.";
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref="/register" backLabel="Register" />

        <div className="mt-5 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Company account
            </p>
            <h1 className="text-3xl font-bold tracking-normal">Register Company</h1>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Register your agency or business as one company account. After package activation, your company can add multiple staff profiles in any category and city according to the selected package limit.
        </p>

        <DismissibleNotice className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" contentClassName="flex gap-3" closeLabel="Close directory warning">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>
              Kamker is a directory only. Security, bodyguard, and firearm
              training related companies must be legal/licensed providers. Weapon
              or ammunition sales are not allowed.
            </p>
        </DismissibleNotice>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close company registration message">
            <p>{statusMessage}</p>
            {status === "success" ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button asChild>
                  <Link href="/register/company">Register Another Company</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={companyId ? `/companies/${companyId}/packages` : "/register/company"}>
                    Continue to Packages
                  </Link>
                </Button>
              </div>
            ) : null}
          </DismissibleNotice>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <form action={registerCompany} className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Basic info</p>
                  <p className="mt-1 text-sm text-muted-foreground">Company identity. Staff categories are selected later for each worker profile.</p>
                </div>
                <FormField
                  label="Company name"
                  name="companyName"
                  defaultValue={draft.companyName}
                  error={errorFor("companyName")}
                  required
                />
                <SelectField
                  label="Company category"
                  name="category"
                  options={companyCategories}
                  defaultValue={draft.category}
                  error={errorFor("category")}
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
                <FormField label="Area" name="area" placeholder="G-10, DHA, Gulberg" defaultValue={draft.area} />
              </div>

              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Contact</p>
                  <p className="mt-1 text-sm text-muted-foreground">Customer-facing phone and WhatsApp details.</p>
                </div>
                <FormField
                  label="Contact person"
                  name="contactPerson"
                  defaultValue={draft.contactPerson}
                  error={errorFor("contactPerson")}
                  required
                />
                <FormField
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="0300 1234567"
                  defaultValue={draft.phone}
                  error={errorFor("phone")}
                  required
                />
                <CountryPhoneField
                  label="WhatsApp number"
                  name="whatsapp"
                  defaultValue={draft.whatsapp}
                  error={errorFor("whatsapp")}
                />
                <FormField
                  label="License number optional"
                  name="licenseNumber"
                  placeholder="For security/bodyguard/fire safety companies"
                  defaultValue={draft.licenseNumber}
                />
              </div>

              <div className="grid gap-4 border-t pt-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Service details</p>
                  <p className="mt-1 text-sm text-muted-foreground">Explain staff types, areas covered, and verification details. Staff profiles are added after package activation.</p>
                </div>
                <TextAreaField
                  label="Company description"
                  name="description"
                  placeholder="Tell customers what services your company offers, areas covered, staff types, timings, and verification details."
                  defaultValue={draft.description}
                  error={errorFor("description")}
                  required
                />
              </div>
              <Button className="h-12 sm:col-span-2">Save Company Details</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
