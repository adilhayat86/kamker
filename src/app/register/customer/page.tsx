import Link from "next/link";

import { FormField, SelectField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cities } from "@/lib/marketplace-data";

export const metadata = {
  title: "Register as Customer | Kamker",
};

export default function CustomerRegisterPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl">
        <Link href="/register" className="text-sm font-medium text-primary">
          Back to register
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Register as Customer
        </h1>
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <form className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" name="fullName" />
              <FormField label="Phone number" name="phone" type="tel" />
              <SelectField label="City" name="city" options={cities} />
              <FormField label="Area" name="area" />
              <Button className="h-12 sm:col-span-2">Register</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
