import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2, MessageCircle, Search, UserRoundPlus } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Kamker | Pakistan Worker Directory",
  description:
    "Kamker helps customers find part time workers and professionals by category and city across Pakistan.",
};

const highlights = [
  {
    title: "Find by category and city",
    description:
      "Customers can browse service groups, shortlist professionals, and contact available workers where phone or WhatsApp is provided.",
    icon: Search,
  },
  {
    title: "Register free as a worker",
    description:
      "Individual professionals can create a profile with service details, city, hourly rate, experience, and verification status.",
    icon: UserRoundPlus,
  },
  {
    title: "Companies can manage staff",
    description:
      "Companies register separately and add multiple company-managed professionals according to their active package.",
    icon: Building2,
  },
  {
    title: "Direct marketplace contact",
    description:
      "Kamker keeps discovery simple with clear profiles, direct contact actions, and visible trust information.",
    icon: MessageCircle,
  },
];

const trustItems = [
  "Register free for workers",
  "No commission from workers",
  "Browse by profession, city, and service group",
  "Contact directly by WhatsApp or call where available",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageNavigation />

        <section className="py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            About Kamker
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-normal text-foreground sm:text-5xl">
            A Pakistan marketplace for finding local workers and professionals.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Kamker is built for customers who need practical help and workers
            who want a clear profile online. It is a directory and requirement
            marketplace, not a job board.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-12">
              <Link href="/categories">Browse Categories</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="py-10">
          <Card className="border-primary/15 bg-secondary/60 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Simple trust messages
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
