import Link from "next/link";
import { BriefcaseBusiness, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Register | Kamker",
  description: "Register as a professional or customer on Kamker.",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-medium text-primary">
          Kamker
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">Register</h1>
        <p className="mt-2 text-muted-foreground">
          Choose how you want to use Kamker.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <BriefcaseBusiness className="size-8 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold">
                Register as Professional
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a professional profile so customers can contact you.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href="/register/professional">Continue</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <User className="size-8 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold">
                Register as Customer
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Save your details and send requirements faster.
              </p>
              <Button asChild className="mt-5 w-full" variant="outline">
                <Link href="/register/customer">Continue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
