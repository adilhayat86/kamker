import Link from "next/link";
import { BriefcaseBusiness, Building2, User } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Register | Kamker",
  description: "Register as a professional, company, or customer on Kamker.",
};

type RegisterPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

function withNext(path: string, next: string) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const next = params?.next?.startsWith("/") && !params.next.startsWith("//")
    ? params.next
    : "";

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation />
        <h1 className="mt-4 text-3xl font-bold tracking-normal">Register</h1>
        <p className="mt-2 text-muted-foreground">
          Choose how you want to use Kamker.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 bg-white shadow-md md:scale-[1.02]">
            <CardContent className="p-5">
              <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BriefcaseBusiness className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">
                Register as Worker
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a professional profile so customers can contact you.
              </p>
              <Button asChild className="mt-5 h-12 w-full">
                <Link href={withNext("/register/professional", next)}>Continue</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Building2 className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">
                Register Company
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Agencies can prepare for paid packages with multiple listings.
              </p>
              <Button asChild className="mt-5 h-12 w-full" variant="outline">
                <Link href={withNext("/register/company", next)}>Continue</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <User className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-semibold">
                Register as Customer
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Save your details and send requirements faster.
              </p>
              <Button asChild className="mt-5 h-12 w-full" variant="outline">
                <Link href={withNext("/register/customer", next)}>Continue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
