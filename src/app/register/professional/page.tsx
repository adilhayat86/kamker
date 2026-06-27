import Link from "next/link";
import { Info } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { ProfessionCategoryField } from "@/components/profession-category-field";
import { RegistrationErrorFocus } from "@/components/registration-error-focus";
import { RegistrationFormAnalytics } from "@/components/registration-analytics";
import { RegistrationSensitiveFieldRestore } from "@/components/registration-sensitive-field-restore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCityOptions } from "@/lib/city-options";
import { getFormDraft } from "@/lib/form-draft";
import { categories } from "@/lib/marketplace-data";
import {
  WORKER_AGE_HELPER_TEXT,
  WORKER_AGE_MAX,
  WORKER_AGE_MIN,
  WORKER_HOURLY_RATE_HELPER_TEXT,
  WORKER_HOURLY_RATE_MAX,
  WORKER_HOURLY_RATE_MIN,
} from "@/lib/worker-profile-limits";
import {
  workerDayAvailabilityOptions,
  workerTimeAvailabilityOptions,
} from "@/lib/worker-availability";

import { registerProfessional } from "./actions";

export const metadata = {
  title: "Register as Professional | Kamker",
};

const statusMessages = {
  success: "You are registered and logged in. Complete your profile to add WhatsApp, area, experience, and verification details.",
  "local-success":
    "Test worker saved locally because Supabase is not configured. Configure Supabase for real registrations and login.",
  missing:
    "Some required information is missing or invalid. Check the highlighted fields below; your typed values and password should remain on this device.",
  "not-configured": "Supabase is not configured yet.",
  error: "Could not register professional. Please try again.",
} as const;

const genderOptions = ["Female", "Male"];

type ProfessionalDraft = {
  fullName: string;
  phone: string;
  city: string;
  category: string;
  gender: string;
  age: string;
  availabilityTime: string;
  availabilityDays: string;
  rate: string;
  errors: string;
};

type ProfessionalRegisterPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
    source?: string;
  }>;
};

export default async function ProfessionalRegisterPage({
  searchParams,
}: ProfessionalRegisterPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const source = params?.source?.trim() ?? "";
  const statusMessage = status ? statusMessages[status] : null;
  const shouldRestoreSensitiveFields =
    status === "missing" ||
    status === "error";
  const draft = await getFormDraft<ProfessionalDraft>("professional");
  const cityOptions = await getCityOptions();
  const failedFields = new Set(
    (draft.errors ?? "").split(",").filter(Boolean),
  );
  const errorFor = (field: string) => {
    const phoneError =
      field === "phone" &&
      (failedFields.has("phoneInvalid") || failedFields.has("phoneDuplicate"));

    if (!failedFields.has(field) && !phoneError) {
      return undefined;
    }

    const messages: Record<string, string> = {
      fullName: "Full name is required.",
      phone: "Phone number is required.",
      phoneInvalid: "Enter your number like 0300 1234567 or +92 300 1234567.",
      phoneDuplicate:
        "This number already has a Kamker account. Login instead, or contact Kamker if this is your number.",
      city: "Choose a city.",
      category: "Choose a profession/category.",
      gender: "Choose gender.",
      age: `Enter an age between ${WORKER_AGE_MIN} and ${WORKER_AGE_MAX}.`,
      availabilityTime: "Choose work time.",
      availabilityDays: "Choose work days.",
      rate: `Enter an hourly rate between Rs ${WORKER_HOURLY_RATE_MIN} and Rs ${WORKER_HOURLY_RATE_MAX.toLocaleString(
        "en-PK"
      )}.`,
      password: "Password is required. Re-enter it after this error.",
    };

    if (field === "phone" && failedFields.has("phoneInvalid")) {
      return messages.phoneInvalid;
    }

    if (field === "phone" && failedFields.has("phoneDuplicate")) {
      return messages.phoneDuplicate;
    }

    return messages[field] ?? "This field needs attention.";
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref="/register" backLabel="Register" />
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Register as Professional
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a short public worker profile. You can complete WhatsApp,
          experience, CNIC, and profile details after signup.
        </p>
        <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          <div className="flex gap-3">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Fast registration</p>
              <p>
                Only the fields needed for search and login are required now.
                Profile photo, WhatsApp, area, experience, CNIC, and recovery
                details can be added after registration from Complete Profile.
              </p>
            </div>
          </div>
        </div>
        {statusMessage ? (
          <DismissibleNotice
            className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium"
            closeLabel="Close registration message"
          >
            {statusMessage}
            {status === "success" ? (
              <Button asChild className="mt-3 w-full sm:w-auto">
                <Link href="/account?status=registered">Go to Account</Link>
              </Button>
            ) : null}
            {status === "local-success" ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/login">Go to Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/professionals">View Local Test Profiles</Link>
                </Button>
              </div>
            ) : null}
          </DismissibleNotice>
        ) : null}
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <form action={registerProfessional} className="grid gap-6" noValidate>
              <RegistrationErrorFocus errors={Array.from(failedFields)} />
              <RegistrationSensitiveFieldRestore
                restoreOnMount={shouldRestoreSensitiveFields}
              />
              <input type="hidden" name="source" value={source} />
              <RegistrationFormAnalytics role="professional" source={source} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                    Required profile
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These details make your worker profile searchable.
                  </p>
                </div>
                <FormField
                  label="Full name"
                  name="fullName"
                  placeholder="Your real name"
                  defaultValue={draft.fullName}
                  error={errorFor("fullName")}
                  autoComplete="name"
                  required
                />
                <FormField
                  label="Phone number"
                  name="phone"
                  type="tel"
                  placeholder="Mobile number for login"
                  defaultValue={draft.phone}
                  error={errorFor("phone")}
                  maxLength={16}
                  inputMode="tel"
                  autoComplete="tel"
                  helperText="Example: 0300 1234567 or +92 300 1234567. Use your active Pakistan mobile number."
                  required
                />
                <SelectField
                  label="City"
                  name="city"
                  options={cityOptions}
                  defaultValue={draft.city}
                  error={errorFor("city")}
                  helperText="Choose the city where customers should search for you."
                  required
                />
                <ProfessionCategoryField
                  options={categories.map((category) => category.name)}
                  defaultValue={draft.category}
                  error={errorFor("category")}
                />
                <SelectField
                  label="Gender"
                  name="gender"
                  options={genderOptions}
                  defaultValue={draft.gender}
                  error={errorFor("gender")}
                  required
                />
                <FormField
                  label="Age"
                  name="age"
                  type="number"
                  placeholder="Your age"
                  defaultValue={draft.age}
                  error={errorFor("age")}
                  helperText={WORKER_AGE_HELPER_TEXT}
                  required
                  min={WORKER_AGE_MIN}
                  max={WORKER_AGE_MAX}
                />
                <SelectField
                  label="Work time"
                  name="availabilityTime"
                  options={workerTimeAvailabilityOptions}
                  defaultValue={draft.availabilityTime}
                  error={errorFor("availabilityTime")}
                  helperText="Choose when customers can usually contact you for work."
                  required
                />
                <SelectField
                  label="Work days"
                  name="availabilityDays"
                  options={workerDayAvailabilityOptions}
                  defaultValue={draft.availabilityDays}
                  error={errorFor("availabilityDays")}
                  helperText="Choose the days you normally accept work."
                  required
                />
                <FormField
                  label="Hourly Rate"
                  name="rate"
                  type="number"
                  placeholder="Amount in rupees"
                  defaultValue={draft.rate}
                  error={errorFor("rate")}
                  inputMode="numeric"
                  helperText={WORKER_HOURLY_RATE_HELPER_TEXT}
                  required
                  min={WORKER_HOURLY_RATE_MIN}
                  max={WORKER_HOURLY_RATE_MAX}
                />
                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  error={errorFor("password")}
                  autoComplete="new-password"
                  helperText="Use a password you can remember. You will need it to log in."
                  required
                />
              </div>

              <Button className="h-12 sm:col-span-2">
                Register and Open Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
