import Link from "next/link";
import { Camera } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { PhotoUploadField } from "@/components/photo-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  workerDayAvailabilityOptions,
  workerTimeAvailabilityOptions,
} from "@/lib/worker-availability";
import { categories, cities } from "@/lib/marketplace-data";
import { getFormDraft } from "@/lib/form-draft";

import { registerProfessional } from "./actions";

export const metadata = {
  title: "Register as Professional | Kamker",
};

const statusMessages = {
  success: "Professional profile submitted successfully. Kamker will review it before it appears publicly.",
  "local-success":
    "Test worker saved locally because Supabase is not configured. Configure Supabase for real registrations and login.",
  missing:
    "Please fill name, phone, city, profession, gender, work time, work days, hourly rate, tagline, password, secret question, and secret answer. Tagline must be 30 characters or less.",
  "not-configured": "Supabase is not configured yet.",
  "invalid-photo": "Upload a jpg, png, or webp image under 8MB.",
  "photo-error": "Could not upload profile photo. Please try again.",
  error: "Could not register professional. Please try again.",
} as const;

const genderOptions = ["Female", "Male"];

type ProfessionalDraft = {
  fullName: string;
  phone: string;
  whatsapp: string;
  city: string;
  area: string;
  category: string;
  gender: string;
  availabilityTime: string;
  availabilityDays: string;
  yearsExperience: string;
  experience: string;
  rate: string;
  tagline: string;
  bio: string;
  secretQuestion: string;
};

type ProfessionalRegisterPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

export default async function ProfessionalRegisterPage({
  searchParams,
}: ProfessionalRegisterPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const draft = await getFormDraft<ProfessionalDraft>("professional");

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
                  Upload a jpg, png, or webp image from your phone. Large photos will be compressed before upload.
                </p>
              </div>
            </div>
            <form action={registerProfessional} className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Basic info</p>
                  <p className="mt-1 text-sm text-muted-foreground">Your name, contact, and work location.</p>
                </div>
                <PhotoUploadField />
                <FormField label="Full name" name="fullName" defaultValue={draft.fullName} />
                <FormField label="Phone number" name="phone" type="tel" defaultValue={draft.phone} />
                <FormField label="WhatsApp number" name="whatsapp" type="tel" defaultValue={draft.whatsapp} />
                <SelectField label="City" name="city" options={cities} defaultValue={draft.city} />
                <FormField label="Area" name="area" placeholder="G-10, DHA, Gulberg" defaultValue={draft.area} />
                <SelectField label="Gender" name="gender" options={genderOptions} defaultValue={draft.gender} />
              </div>

              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">Service details</p>
                  <p className="mt-1 text-sm text-muted-foreground">This is what customers scan first.</p>
                </div>
                <SelectField
                  label="Profession/category"
                  name="category"
                  options={categories.map((category) => category.name)}
                  defaultValue={draft.category}
                />
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Work time</span>
                  <select
                    name="availabilityTime"
                    defaultValue={draft.availabilityTime ?? ""}
                    className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Work days</span>
                  <select
                    name="availabilityDays"
                    defaultValue={draft.availabilityDays ?? ""}
                    className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                </label>
                <FormField
                  label="Years of experience"
                  name="yearsExperience"
                  type="number"
                  placeholder="5"
                  defaultValue={draft.yearsExperience}
                />
                <FormField
                  label="Hourly Rate"
                  name="rate"
                  placeholder="Rs. 500/hour"
                  defaultValue={draft.rate}
                />
                <FormField
                  label="Profile Tagline"
                  name="tagline"
                  placeholder="Trusted elderly caregiver"
                  maxLength={30}
                  defaultValue={draft.tagline}
                />
                <FormField
                  label="Experience details"
                  name="experience"
                  placeholder="5 years home nursing"
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
                <FormField label="CNIC optional" name="cnic" />
                <FormField label="Password" name="password" type="password" />
                <FormField
                  label="Secret question"
                  name="secretQuestion"
                  placeholder="What is your first school name?"
                  defaultValue={draft.secretQuestion}
                />
                <FormField
                  label="Secret answer"
                  name="secretAnswer"
                  type="password"
                  placeholder="Answer"
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
