import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Search, UserPlus } from "lucide-react";

import { AdBanner } from "@/components/ad-banner";
import { KamkerLogo } from "@/components/kamker-logo";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  knownSeoCategoryNames,
  type SeoLandingPage,
} from "@/lib/seo-landing-pages";
import { categorySlug } from "@/lib/marketplace-data";

type SeoLandingPageViewProps = {
  page: SeoLandingPage;
};

function jsonLdFor(page: SeoLandingPage) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.heading,
    description: page.description,
    url: `https://kamker.com/${page.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Kamker",
      url: "https://kamker.com",
    },
    about: page.focusCategory ?? "Part time workers",
    areaServed: page.focusCity ?? "Pakistan",
  };
}

export function SeoLandingPageView({ page }: SeoLandingPageViewProps) {
  const relatedCategories = knownSeoCategoryNames(page.relatedCategories);

  return (
    <main className="min-h-screen bg-background pb-16">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <PageNavigation backHref="/" backLabel="Home" />
        </div>
      </section>

      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <Search className="size-3.5" aria-hidden="true" />
              Kamker worker directory
            </Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              {page.heading}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {page.intro}
            </p>
            <div className="mt-6 grid gap-3 sm:flex">
              <Button asChild className="h-12">
                <Link href={page.primaryHref}>
                  {page.primaryLabel}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild className="h-12" variant="outline">
                <Link href={page.secondaryHref}>{page.secondaryLabel}</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              Kamker is a worker directory and requirement marketplace, not a
              traditional part time job board.
            </p>
          </div>

          <Card className="border-sky-100 bg-white shadow-sm">
            <CardContent className="p-5">
              <KamkerLogo className="mb-5" />
              <div className="grid gap-3">
                {[
                  "Search workers by category and city",
                  "Register free as a worker",
                  "No commission from workers",
                  "Contact directly where call or WhatsApp is available",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 size-5 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AdBanner label="Reserved ad space for local services" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              How to use Kamker
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal">
              Find workers without job-board noise
            </h2>
            <div className="mt-5 grid gap-4">
              {[
                ["Choose the right service", "Start with a category such as maids, nurses, drivers, tutors, or electricians."],
                ["Filter by city", "Use city and category filters to focus on workers near your need."],
                ["Contact or send requirement", "Use direct contact where available, or request reviewed outreach through Kamker."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-sky-100 bg-sky-50/50 p-4">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Related worker categories
            </p>
            <div className="mt-4 grid gap-2">
              {relatedCategories.map((category) => (
                <Link
                  key={category}
                  href={`/categories/${categorySlug(category)}`}
                  className="flex items-center justify-between rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-primary hover:text-primary"
                >
                  <span>{category}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-xl bg-primary p-5 text-white shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-white/80">
              Ready to search?
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal">
              Browse workers or register on Kamker.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Workers can register free. Customers can browse by category and
              city or request reviewed outreach.
            </p>
          </div>
          <div className="grid gap-2 sm:w-56">
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <Link href={page.primaryHref}>
                <MapPin aria-hidden="true" />
                Find workers
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
              <Link href="/register">
                <UserPlus aria-hidden="true" />
                Register
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdFor(page)),
        }}
      />
    </main>
  );
}
