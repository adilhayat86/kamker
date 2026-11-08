import Link from "next/link";

import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact Us | Kamker",
  description: "Contact Kamker for worker, company, and marketplace support.",
};

const supportEmail = process.env.NEXT_PUBLIC_KAMKER_SUPPORT_EMAIL?.trim() || "adilhayatkamker@gmail.com";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation />
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Contact
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">Contact Kamker</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              For company packages, proof review, or marketplace support, contact Kamker support. Public users can browse workers by category and city without login.
            </p>
            <div className="mt-5 grid gap-3 sm:flex">
              <Button asChild className="h-12">
                <a href={`mailto:${supportEmail}`}>Email Support</a>
              </Button>
              <Button asChild variant="outline" className="h-12">
                <Link href="/categories">Browse Categories</Link>
              </Button>
            </div>
            <p className="mt-4 break-all text-sm text-muted-foreground">{supportEmail}</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
