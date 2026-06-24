import Link from "next/link";
import { Camera, Info } from "lucide-react";

import { CountryPhoneField } from "@/components/country-phone-field";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { PhotoUploadField } from "@/components/photo-upload-field";
import { ProfessionCategoryField } from "@/components/profession-category-field";
import { RegistrationFormAnalytics } from "@/components/registration-analytics";
import { RegistrationSensitiveFieldRestore } from "@/components/registration-sensitive-field-restore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  workerDayAvailabilityOptions,
  workerTimeAvailabilityOptions,
} from "@/lib/worker-availability";
import { getCityOptions } from "@/lib/city-options";
import { categories } from "@/lib/marketplace-data";
import { getFormDraft } from "@/lib/form-draft";
import { cn } from "@/lib/utils";

import { registerProfessional } from "./actions";

export const metadata = {
  title: "Register as Professional | Kamker",
};

const statusMessages = {
  success: "Professional profile submitted successfully. Kamker will review it before it appears publicly.",
  "local-success":
    "Test worker saved locally because Supabase is not configured. Configure Supabase for real registrations and login.",
  missing:
    "Some required information is missing or invalid. Check the highlighted fields below; your typed values, password, and selected photo should remain on this device.",
  "not-configured": "Supabase is not configured yet.",
  "invalid-photo": "Upload a jpg, png, or webp image under 10MB.",
  "photo-error": "Could not upload profile photo. Please try again.",
  error: "Could not register professional. Please try again.",
} as const;

const genderOptions = ["Female", "Male"];

const secretQuestionOptions = [
  "What is your first school name?",
  "What is your favorite color?",
  "What is your childhood nickname?",
  "What is your mother tongue?",
  "What city were you born in?",
];

type ProfessionalDraft = {
  fullName: string;
  phone: string;
  whatsapp: string;
  city: string;
  area: string;
  category: string;
  gender: string;
  age: string;
  availabilityTime: string;
  availabilityDays: string;
  yearsExperience: string;
  experience: string;
  rate: string;
  tagline: string;
  bio: string;
  secretQuestion: string;
  errors: string;
};

type ProfessionalRegisterPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
    source?: string;
  }>;
};

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-red-600">
        *
      </span>
      <span className="sr-only"> required</span>
    </>
  );
}

export default async function ProfessionalRegisterPage({
  searchParams,
}: ProfessionalRegisterPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const source = params?.source?.trim() ?? "";
  const statusMessage = status ? statusMessages[status] : null;
  const shouldRestoreSensitiveFields =
    status === "missing" ||
    status === "invalid-photo" ||
    status === "photo-error" ||
    status === "error";
  const draft = await getFormDraft<ProfessionalDraft>("professional");
  const cityOptions = await getCityOptions();
  const failedFields = new Set(
    (draft.errors ?? "").split(",").filter(Boolean),
  );
  const errorFor = (field: string) => {
    const phoneError = field === "phone" && (
      failedFields.has("phoneInvalid") || failedFields.has("phoneDuplicate")
    );
    const whatsappError = field === "whatsapp" && failedFields.has("whatsappInvalid");

    if (!failedFields.has(field) && !phoneError && !whatsappError) {
      return undefined;
    }

    const messages: Record<string, string> = {
      fullName: "Full name is required.",
      phone: "Phone number is required.",
      phoneInvalid: "Enter a valid Pakistan mobile number.",
      phoneDuplicate: "This phone number is already registered. Login or contact Kamker support if this is your number.",
      whatsappInvalid: "Enter a valid WhatsApp number or leave it blank.",
      city: "Choose a city.",
      category: "Choose a profession/category.",
      gender: "Choose gender.",
      age: "Enter an age between 16 and 80.",
      availabilityTime: "Choose work time.",
      availabilityDays: "Choose work days.",
      rate: "Hourly rate is required.",
      tagline: "Tagline is required and must be 30 characters or less.",
      password: "Password is required. Re-enter it after this error.",
      secretQuestion: "Choose a secret question.",
      secretAnswer: "Secret answer is required. Re-enter it after this error.",
    };

    if (field === "phone" && failedFields.has("phoneInvalid")) {
      return messages.phoneInvalid;
    }

    if (field === "phone" && failedFields.has("phoneDuplicate")) {
      return messages.phoneDuplicate;
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
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Register as Professional
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an hourly-rate profile so customers can find and contact you directly.
        </p>
        <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          <div className="flex gap-3">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Before you submit</p>
              <p>
                Fields marked with <span className="font-semibold text-red-700">*</span> are required.
                Example text inside a box is only a guide; it is not saved unless you type your own value.
                If photo upload causes trouble, register without photo first and add it later.
              </p>
            </div>
          </div>
        </div>
        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close registration message">
            {statusMessage}
            {status === "success" ? (
              <Button asChild className="mt-3 w-full sm:w-auto">
                <Link href="/login">Go to Login</Link>
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
            <div className="mb-5 flex items-center gap-4 rounded-lg border border-dashed p-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Camera className="size-7" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Profile photo</p>
                <p className="text-sm text-muted-foreground">
                  Optional. Upload a jpg, png, or webp image from your phone. Large photos will be compressed before upload.
                </p>
              </div>
            </div>
            <form action={registerProfessional} className="grid gap-6">
              <RegistrationSensitiveFieldRestore restoreOnMount={shouldRestoreSensitiveFields} />
              <input type="hidden" name="source" value={source} />
              <RegistrationFormAnalytics role="professional" source={source} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Basic info</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your name, contact, and work location.</p>
                </div>
                <PhotoUploadField />
                <FormField label="Full name" name="fullName" placeholder="Your real name" defaultValue={draft.fullName} error={errorFor("fullName")} autoComplete="name" required />
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
                  helperText="Use your active Pakistan mobile number. Customers will use this to contact you and you will use it to log in."
                  required
                />
                <CountryPhoneField label="WhatsApp number" name="whatsapp" defaultValue={draft.whatsapp} error={errorFor("whatsapp")} />
                <SelectField label="City" name="city" options={cityOptions} defaultValue={draft.city} error={errorFor("city")} helperText="Choose the city where customers should search for you." required />
                <FormField label="Area" name="area" placeholder="Work area or nearby society" defaultValue={draft.area} />
                <SelectField label="Gender" name="gender" options={genderOptions} defaultValue={draft.gender} error={errorFor("gender")} required />
                <FormField
                  label="Age"
                  name="age"
                  type="number"
                  placeholder="Your age"
                  defaultValue={draft.age}
                  error={errorFor("age")}
                  helperText="Age must be between 16 and 80."
                  required
                  min={16}
                  max={80}
                />
              </div>

              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Service details</p>
                  <p className="mt-1 text-sm text-muted-foreground">This is what customers scan first.</p>
                </div>
                <ProfessionCategoryField
                  options={categories.map((category) => category.name)}
                  defaultValue={draft.category}
                  error={errorFor("category")}
                />
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Work time<RequiredMark /></span>
                  <select
                    name="availabilityTime"
                    defaultValue={draft.availabilityTime ?? ""}
                    required
                    aria-invalid={Boolean(errorFor("availabilityTime"))}
                    aria-describedby="availability-time-help"
                    className={cn(
                      "h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      errorFor("availabilityTime") &&
                        "border-red-500 bg-red-50 focus-visible:ring-red-500",
                    )}
                  >
                    <option value="" disabled>
                      Select work time
                    </option>
                    {workerTimeAvailabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span id="availability-time-help" className="text-xs leading-5 text-muted-foreground">
                    Choose the time customers can usually contact you for work.
                  </span>
                  {errorFor("availabilityTime") ? (
                    <span className="text-xs font-medium text-red-600">
                      {errorFor("availabilityTime")}
                    </span>
                  ) : null}
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Work days<RequiredMark /></span>
                  <select
                    name="availabilityDays"
                    defaultValue={draft.availabilityDays ?? ""}
                    required
                    aria-invalid={Boolean(errorFor("availabilityDays"))}
                    aria-describedby="availability-days-help"
                    className={cn(
                      "h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      errorFor("availabilityDays") &&
                        "border-red-500 bg-red-50 focus-visible:ring-red-500",
                    )}
                  >
                    <option value="" disabled>
                      Select work days
                    </option>
                    {workerDayAvailabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span id="availability-days-help" className="text-xs leading-5 text-muted-foreground">
                    Choose the days you normally accept work.
                  </span>
                  {errorFor("availabilityDays") ? (
                    <span className="text-xs font-medium text-red-600">
                      {errorFor("availabilityDays")}
                    </span>
                  ) : null}
                </label>
                <FormField
                  label="Years of experience"
                  name="yearsExperience"
                  type="number"
                  placeholder="Years"
                  defaultValue={draft.yearsExperience}
                  min={0}
                />
                <FormField
                  label="Hourly Rate"
                  name="rate"
                  type="number"
                  placeholder="Amount in rupees"
                  defaultValue={draft.rate}
                  error={errorFor("rate")}
                  inputMode="numeric"
                  helperText="Write numbers only. Example: type 500 instead of Rs. 500/hour."
                  required
                  min={0}
                />
                <FormField
                  label="Profile Tagline"
                  name="tagline"
                  placeholder="Short trust-building line"
                  maxLength={30}
                  defaultValue={draft.tagline}
                  error={errorFor("tagline")}
                  helperText="Maximum 30 characters. This appears under your name in search results."
                  required
                />
                <FormField
                  label="Experience details"
                  name="experience"
                  placeholder="Brief work history"
                  defaultValue={draft.experience}
                />
                <div className="sm:col-span-2">
                  <TextAreaField
                    label="Short bio"
                    name="bio"
                    placeholder="Tell customers what services you offer, your timing, and your preferred work areas."
                    defaultValue={draft.bio}
                  />
                </div>
              </div>

              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Security</p>
                  <p className="mt-1 text-sm text-muted-foreground">Used for login, review, and account recovery.</p>
                </div>
                <FormField label="CNIC optional" name="cnic" helperText="CNIC can be added later for verification." />
                <FormField label="Password" name="password" type="password" error={errorFor("password")} autoComplete="new-password" helperText="Use a password you can remember. You will need it to log in after registration." required />
                <SelectField
                  label="Secret question"
                  name="secretQuestion"
                  options={secretQuestionOptions}
                  defaultValue={draft.secretQuestion}
                  error={errorFor("secretQuestion")}
                  helperText="Choose a question for account recovery. Do not leave the placeholder selected."
                  required
                />
                <FormField
                  label="Secret answer"
                  name="secretAnswer"
                  type="password"
                  placeholder="Your recovery answer"
                  error={errorFor("secretAnswer")}
                  autoComplete="off"
                  helperText="Keep this answer private. You may need it if you forget your password."
                  required
                />
              </div>
              <Button className="h-12 sm:col-span-2">Register for Hourly Work</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
