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

const statusMessages = {
  success: "Professional profile submitted successfully. You can now log in.",
  missing:
    "Please fill name, phone, city, profession, password, secret question, and secret answer.",
  "not-configured": "Supabase is not configured yet.",
  error: "Could not register professional. Please try again.",
} as const;

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
                <p className="font-semibold">Profile photo placeholder</p>
                <p className="text-sm text-muted-foreground">
                  Upload support will be connected later.
                </p>
              </div>
            </div>
            <form action={registerProfessional} className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" name="fullName" />
              <FormField label="Phone number" name="phone" type="tel" />
              <FormField label="WhatsApp number" name="whatsapp" type="tel" />
              <SelectField label="City" name="city" options={cities} />
              <FormField label="Area" name="area" />
              <SelectField
                label="Profession/category"
                name="category"
                options={categories.map((category) => category.name)}
              />
              <FormField label="Experience" name="experience" placeholder="5 years" />
              <FormField label="Expected rate" name="rate" placeholder="Rs. 2,000/day" />
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
                <TextAreaField label="Short bio" name="bio" />
              </div>
              <Button className="h-12 sm:col-span-2">Register</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
