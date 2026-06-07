import { redirect } from "next/navigation";
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

import { updateProfessionalProfile } from "./actions";

export const metadata = {
  title: "Edit Profile | Kamker",
  description: "Update your Kamker professional profile.",
};

const availabilityOptions = ["Full Time", "Part Time Morning", "Part Time Evening"];
const genderOptions = ["Female", "Male"];

const statusMessages = {
  missing: "Please fill name, phone, city, profession, gender, age, availability, hourly rate, and tagline. Age must be between 16 and 80. Tagline must be 30 characters or less.",
  "not-configured": "Supabase is not configured yet.",
  "invalid-photo": "Upload a jpg, png, or webp image under 8MB.",
  "photo-error": "Could not upload profile photo. Please try again.",
  error: "Could not update profile. Please try again.",
} as const;

type EditAccountPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

function TextInput({
  label,
  name,
  value,
  type = "text",
  placeholder,
  maxLength,
  disabled = false,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
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
        className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function SelectInput({
  label,
  name,
  value,
  options,
  disabled = false,
}: {
  label: string;
  name: string;
  value?: string | null;
  options: string[];
  disabled?: boolean;
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function EditAccountPage({
  searchParams,
}: EditAccountPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
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
  const availability = dbProfessional?.availability ?? "";
  const yearsExperience = dbProfessional?.years_experience ?? 0;
  const experience = dbProfessional?.experience ?? demoProfessional?.experience;
  const expectedRate = dbProfessional?.expected_rate ?? demoProfessional?.rate;
  const tagline = dbProfessional?.tagline ?? demoProfessional?.tagline ?? "";
  const bio = dbProfessional?.short_bio ?? demoProfessional?.bio;

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
              <h1 className="text-3xl font-bold tracking-normal">Edit Profile</h1>
            </div>
          </div>
          <p className="mt-3 text-muted-foreground">
            Update your hourly rate, availability, service area, contact info,
            experience, and bio.
          </p>
        </div>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close profile update message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        {isDemo ? (
          <DismissibleNotice className="mt-5 rounded-lg border border-dashed bg-secondary/60 p-4 text-sm text-muted-foreground" closeLabel="Close demo profile notice">
            Demo profile is shown because Supabase has no professional account
            available. Register or configure Supabase to enable updates.
          </DismissibleNotice>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <form action={updateProfessionalProfile} className="grid gap-4 sm:grid-cols-2">
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
                  />
                  <CountryPhoneField
                    label="WhatsApp number"
                    name="whatsapp"
                    defaultValue={whatsappNumber}
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
                disabled={isDemo}
              />
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
              />
              <SelectInput
                label="Availability"
                name="availability"
                value={availability}
                options={availabilityOptions}
                disabled={isDemo}
              />
              <TextInput
                label="Years of experience"
                name="yearsExperience"
                type="number"
                value={yearsExperience}
                placeholder="5"
                disabled={isDemo}
              />
              <TextInput
                label="Hourly Rate"
                name="rate"
                value={expectedRate}
                placeholder="Rs. 500/hour"
                disabled={isDemo}
              />
              <TextInput
                label="Profile Tagline"
                name="tagline"
                value={tagline}
                placeholder="Trusted elderly caregiver"
                maxLength={30}
                disabled={isDemo}
              />
              <TextInput
                label="Experience details"
                name="experience"
                value={experience}
                placeholder="5 years home nursing"
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
              <Button className="h-12 sm:col-span-2" disabled={isDemo}>
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
