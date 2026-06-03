import Link from "next/link";
import { Camera } from "lucide-react";

import { FormField, SelectField, TextAreaField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { categories, cities } from "@/lib/marketplace-data";

import { registerProfessional } from "./actions";

export const metadata = {
  title: "Register as Professional | Kamker",
};

const availabilityOptions = ["Full Time", "Part Time Morning", "Part Time Evening"];

const statusMessages = {
  success: "Professional profile submitted successfully. Kamker will review it before it appears publicly.",
  missing:
    "Please fill name, phone, city, profession, gender, availability, hourly rate, password, secret question, and secret answer.",
  "not-configured": "Supabase is not configured yet.",
  "invalid-photo": "Upload a jpg, png, or webp image under 2MB.",
  "photo-error": "Could not upload profile photo. Please try again.",
  error: "Could not register professional. Please try again.",
} as const;

const genderOptions = ["Female", "Male"];

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
          <div className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium">
            {statusMessage}
            {status === "success" ? (
              <Button asChild className="mt-3 w-full sm:w-auto">
                <Link href="/login">Go to Login</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center gap-4 rounded-lg border border-dashed p-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Camera className="size-7" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">Profile photo</p>
                <p className="text-sm text-muted-foreground">
                  Upload a jpg, png, or webp image under 2MB.
                </p>
              </div>
            </div>
            <form action={registerProfessional} className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Profile photo</span>
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                />
              </label>
              <FormField label="Full name" name="fullName" />
              <FormField label="Phone number" name="phone" type="tel" />
              <FormField label="WhatsApp number" name="whatsapp" type="tel" />
              <SelectField label="City" name="city" options={cities} />
              <FormField label="Area" name="area" placeholder="G-10, DHA, Gulberg" />
              <SelectField
                label="Profession/category"
                name="category"
                options={categories.map((category) => category.name)}
              />
              <SelectField label="Gender" name="gender" options={genderOptions} />
              <SelectField
                label="Availability"
                name="availability"
                options={availabilityOptions}
              />
              <FormField
                label="Years of experience"
                name="yearsExperience"
                type="number"
                placeholder="5"
              />
              <FormField
                label="Hourly Rate"
                name="rate"
                placeholder="Rs. 500/hour"
              />
              <FormField
                label="Experience details"
                name="experience"
                placeholder="5 years home nursing"
              />
              <FormField label="CNIC optional" name="cnic" />
              <FormField label="Password" name="password" type="password" />
              <FormField
                label="Secret question"
                name="secretQuestion"
                placeholder="What is your first school name?"
              />
              <FormField
                label="Secret answer"
                name="secretAnswer"
                type="password"
                placeholder="Answer"
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  label="Short bio"
                  name="bio"
                  placeholder="Tell customers what services you offer, your timing, and your preferred work areas."
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
