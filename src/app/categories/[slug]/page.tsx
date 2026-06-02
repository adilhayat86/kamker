import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { BroadcastRequirementCta } from "@/components/broadcast-requirement-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBroadcastRecipientCount } from "@/lib/broadcast";
import {
  categories,
  categorySlug,
  findCategoryBySlug,
} from "@/lib/marketplace-data";

type CategoryDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    city?: string;
    area?: string;
  }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({
    slug: categorySlug(category.name),
  }));
}

export async function generateMetadata({ params }: CategoryDetailPageProps) {
  const { slug } = await params;
  const category = findCategoryBySlug(slug);

  return {
    title: category
      ? `${category.name} Professionals | Kamker`
      : "Category | Kamker",
    description: category
      ? `Find and send requirements to ${category.name} professionals on Kamker.`
      : "Find professionals on Kamker.",
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = findCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const city = query?.city?.trim() || undefined;
  const area = query?.area?.trim() || undefined;
  const recipientCount = await getBroadcastRecipientCount({
    category: category.name,
    subcategory: category.name,
    city,
    area,
  });

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              K
            </span>
            Kamker
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">
              <ArrowLeft aria-hidden="true" />
              Categories
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Badge variant="secondary">Category</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
          {category.name} Professionals
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Send one requirement and reach approved professionals matching this
          service category.
        </p>

        {city || area ? (
          <div className="mt-4 flex w-fit items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {[area, city].filter(Boolean).join(", ")}
          </div>
        ) : null}

        <BroadcastRequirementCta
          count={recipientCount}
          category={category.name}
          subcategory={category.name}
          city={city}
          area={area}
        />

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              How it works
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="font-semibold">1. Describe need</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add service, city, area, timing, and contact details.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">2. Save free</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Free mode saves the requirement for review.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">3. Broadcast later</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Paid broadcast can message all matching professionals later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
