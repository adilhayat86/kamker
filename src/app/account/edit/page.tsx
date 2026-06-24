import { redirect } from "next/navigation";
import type { InputHTMLAttributes } from "react";
import { Save, UserCog } from "lucide-react";

import { CountryPhoneField } from "@/components/country-phone-field";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { PhotoUploadField } from "@/components/photo-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAccountProfessional, getDemoAccountProfessional } from "@/lib/account";
import { getCityOptions } from "@/lib/city-options";
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

import { updateProfessionalProfile } from "./actions";

export const metadata = {
  title: "Complete Profile | Kamker",
  description: "Complete your Kamker professional profile.",
};

const genderOptions = ["Female", "Male"];

const secretQuestionOptions = [
  "What is your first school name?",
  "What is your favorite color?",
  "What is your childhood nickname?",
  "What is your mother tongue?",
  "What city were you born in?",
];

const statusMessages = {
  missing:
    `Please fill name, phone, city, profession, gender, age, work time, work days, and hourly rate. Age must be ${WORKER_AGE_MIN}-${WORKER_AGE_MAX}. Hourly rate must be Rs ${WORKER_HOURLY_RATE_MIN}-${WORKER_HOURLY_RATE_MAX.toLocaleString(
      "en-PK"
    )}.`,
  "not-configured": "Supabase is not configured yet.",
  "invalid-photo": "Upload a jpg, png, or webp image under 8MB.",
  "photo-error": "Could not upload profile photo. Please try again.",
  "phone-invalid":
    "Enter your number like 0300 1234567 or +92 300 1234567.",
  "whatsapp-invalid": "Enter a valid WhatsApp number or leave it blank.",
  "duplicate-phone": "This phone number is already registered to another worker profile.",
  "tagline-invalid": "Profile tagline must be 30 characters or less.",
  "recovery-missing": "To add account recovery, choose a secret question and enter an answer.",
  error: "Could not update profile. Please try again.",
} as const;

type EditAccountPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

type SelectOption = string | { value: string; label: string };

function TextInput({
  label,
  name,
  value,
  type = "text",
  placeholder,
  maxLength,
  error,
  helperText,
  disabled = false,
  min,
  max,
  inputMode,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const helpId = helperText ? `${name}-help` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value ?? ""}
        placeholder={placeholder ?? label}
        maxLength={maxLength}
        disabled={disabled}
        min={min}
        max={max}
        inputMode={inputMode}
        aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className={`h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${error ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""}`}
      />
      {helperText ? (
        <span id={helpId} className="text-xs leading-5 text-muted-foreground">
          {helperText}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SelectInput({
  label,
  name,
  value,
  options,
  disabled = false,
  helperText,
}: {
  label: string;
  name: string;
  value?: string | null;
  options: readonly SelectOption[];
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        defaultValue={value ?? ""}
        disabled={disabled}
        className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {helperText ? (
        <span className="text-xs leading-5 text-muted-foreground">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}

export default async function EditAccountPage({
  searchParams,
}: EditAccountPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const phoneError =
    status === "phone-invalid"
      ? statusMessages["phone-invalid"]
      : status === "duplicate-phone"
        ? statusMessages["duplicate-phone"]
        : undefined;
  const whatsappError =
    status === "whatsapp-invalid" ? statusMessages["whatsapp-invalid"] : undefined;
  const taglineError =
    status === "tagline-invalid" ? statusMessages["tagline-invalid"] : undefined;
  const [dbProfessional, cityOptions] = await Promise.all([
    getAccountProfessional(),
    getCityOptions(),
  ]);

  if (!dbProfessional) {
    redirect("/login");
  }

  const demoProfessional = dbProfessional ? null : getDemoAccountProfessional();
  const isDemo = !dbProfessional;

  const fullName = dbProfessional?.full_name ?? demoProfessional?.name ?? "";
  const profession =
    dbProfessional?.categories?.name ?? demoProfessional?.role ?? "";
  const city = dbProfessional?.cities?.name ?? demoProfessional?.city ?? "";
  const area = dbProfessional?.area ?? demoProfessional?.area ?? "";
  const phoneNumber = dbProfessional?.phone_number ?? demoProfessional?.phone_number;
  const whatsappNumber =
    dbProfessional?.whatsapp_number ?? demoProfessional?.whatsapp_number;
  const gender = dbProfessional?.gender ?? "";
  const age = dbProfessional?.age ?? "";
  const availabilityTime = dbProfessional?.availability_time ?? "";
  const availabilityDays = dbProfessional?.availability_days ?? "";
  const yearsExperience = dbProfessional?.years_experience ?? 0;
  const experience = dbProfessional?.experience ?? demoProfessional?.experience;
  const expectedRate = dbProfessional?.expected_rate ?? demoProfessional?.rate;
  const tagline = dbProfessional?.tagline ?? demoProfessional?.tagline ?? "";
  const bio = dbProfessional?.short_bio ?? demoProfessional?.bio;
  const cnic = dbProfessional?.cnic ?? "";

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref="/account" backLabel="Account" />

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UserCog className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Professional account
              </p>
              <h1 className="text-3xl font-bold tracking-normal">
                Complete Profile
              </h1>
            </div>
          </div>
          <p className="mt-3 text-muted-foreground">
            Add WhatsApp, area, experience, CNIC, recovery question, and a short
            profile tagline after your fast signup.
          </p>
        </div>

        {statusMessage ? (
          <DismissibleNotice
            className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium"
            closeLabel="Close profile update message"
          >
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        {isDemo ? (
          <DismissibleNotice
            className="mt-5 rounded-lg border border-dashed bg-secondary/60 p-4 text-sm text-muted-foreground"
            closeLabel="Close demo profile notice"
          >
            Demo profile is shown because Supabase has no professional account
            available. Register or configure Supabase to enable updates.
          </DismissibleNotice>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <form action={updateProfessionalProfile} className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                    Profile photo and contact
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These fields help customers identify and contact you.
                  </p>
                </div>
                <PhotoUploadField disabled={isDemo} />
                <TextInput
                  label="Full name"
                  name="fullName"
                  value={fullName}
                  disabled={isDemo}
                />
                {isDemo ? (
                  <>
                    <TextInput
                      label="Phone number"
                      name="phone"
                      type="tel"
                      value={phoneNumber}
                      maxLength={16}
                      disabled
                    />
                    <TextInput
                      label="WhatsApp number"
                      name="whatsapp"
                      type="tel"
                      value={whatsappNumber}
                      disabled
                    />
                  </>
                ) : (
                  <>
                    <TextInput
                      label="Phone number"
                      name="phone"
                      type="tel"
                      value={phoneNumber}
                      error={phoneError}
                      maxLength={16}
                      helperText="Example: 0300 1234567 or +92 300 1234567."
                    />
                    <CountryPhoneField
                      label="WhatsApp number"
                      name="whatsapp"
                      defaultValue={whatsappNumber}
                      error={whatsappError}
                    />
                  </>
                )}
                <SelectInput
                  label="City"
                  name="city"
                  value={city}
                  options={cityOptions}
                  disabled={isDemo}
                />
                <TextInput
                  label="Area"
                  name="area"
                  value={area}
                  placeholder="Work area or nearby society"
                  disabled={isDemo}
                />
              </div>

              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                    Work details
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep this accurate so customers find the right worker.
                  </p>
                </div>
                <SelectInput
                  label="Profession/category"
                  name="category"
                  value={profession}
                  options={categories.map((category) => category.name)}
                  disabled={isDemo}
                />
                <SelectInput
                  label="Gender"
                  name="gender"
                  value={gender}
                  options={genderOptions}
                  disabled={isDemo}
                />
                <TextInput
                  label="Age"
                  name="age"
                  type="number"
                  value={age}
                  placeholder="28"
                  disabled={isDemo}
                  min={WORKER_AGE_MIN}
                  max={WORKER_AGE_MAX}
                  inputMode="numeric"
                  helperText={WORKER_AGE_HELPER_TEXT}
                />
                <SelectInput
                  label="Work time"
                  name="availabilityTime"
                  value={availabilityTime}
                  options={workerTimeAvailabilityOptions}
                  disabled={isDemo}
                />
                <SelectInput
                  label="Work days"
                  name="availabilityDays"
                  value={availabilityDays}
                  options={workerDayAvailabilityOptions}
                  disabled={isDemo}
                />
                <TextInput
                  label="Hourly Rate"
                  name="rate"
                  type="number"
                  value={expectedRate}
                  placeholder="500"
                  inputMode="numeric"
                  min={WORKER_HOURLY_RATE_MIN}
                  max={WORKER_HOURLY_RATE_MAX}
                  helperText={WORKER_HOURLY_RATE_HELPER_TEXT}
                  disabled={isDemo}
                />
                <TextInput
                  label="Years of experience"
                  name="yearsExperience"
                  type="number"
                  value={yearsExperience}
                  placeholder="5"
                  disabled={isDemo}
                  min={0}
                />
                <TextInput
                  label="Profile Tagline"
                  name="tagline"
                  value={tagline}
                  placeholder="Trusted elderly caregiver"
                  maxLength={30}
                  error={taglineError}
                  helperText="Optional, maximum 30 characters. This appears under your name."
                  disabled={isDemo}
                />
                <TextInput
                  label="Experience details"
                  name="experience"
                  value={experience}
                  placeholder="5 years home nursing"
                  disabled={isDemo}
                />
                <TextInput
                  label="CNIC"
                  name="cnic"
                  value={cnic}
                  placeholder="Optional for verification"
                  disabled={isDemo}
                />
                <label className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-medium">Bio</span>
                  <textarea
                    name="bio"
                    defaultValue={bio ?? ""}
                    disabled={isDemo}
                    className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="Write a short profile bio. Mention services, timing, hourly rate, and preferred work areas."
                  />
                </label>
              </div>

              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                    Account recovery
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Optional. Add this only if you want secret-question password recovery.
                  </p>
                </div>
                <SelectInput
                  label="Secret question"
                  name="secretQuestion"
                  value=""
                  options={secretQuestionOptions}
                  disabled={isDemo}
                />
                <TextInput
                  label="Secret answer"
                  name="secretAnswer"
                  type="password"
                  placeholder="Private answer"
                  helperText="Leave both recovery fields blank if you do not want to set recovery now."
                  disabled={isDemo}
                />
              </div>

              <Button className="h-12" disabled={isDemo}>
                <Save aria-hidden="true" />
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
