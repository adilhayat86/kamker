import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { BroadcastRequirementCta } from "@/components/broadcast-requirement-cta";
import { CategoryGrid } from "@/components/category-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBroadcastRecipientCount } from "@/lib/broadcast";
import {
  categories,
  categorySlug,
  findCategoryBySlug,
  findServiceGroupBySlug,
  findServiceGroupForCategory,
  getGroupSubcategoryCards,
  parentCategories,
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
  return [...parentCategories, ...categories].map((category) => ({
    slug: categorySlug(category.name),
  }));
}

export async function generateMetadata({ params }: CategoryDetailPageProps) {
  const { slug } = await params;
  const serviceGroup = findServiceGroupBySlug(slug);
  const category = findCategoryBySlug(slug);
  const name = serviceGroup?.name ?? category?.name;

  return {
    title: name ? `${name} Professionals | Kamker` : "Category | Kamker",
    description: name
      ? `Find and send requirements to ${name} professionals on Kamker.`
      : "Find professionals on Kamker.",
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const serviceGroup = findServiceGroupBySlug(slug);
  const category = findCategoryBySlug(slug);

  if (!serviceGroup && !category) {
    notFound();
  }

  const city = query?.city?.trim() || undefined;
  const area = query?.area?.trim() || undefined;
  const parentGroup = category ? findServiceGroupForCategory(category.name) : null;
  const pageName = serviceGroup?.name ?? category?.name ?? "Category";
  const pageDescription = serviceGroup
    ? serviceGroup.description
    : parentGroup
      ? `${category?.name} are part of ${parentGroup.name}. Send one requirement and reach approved matching professionals.`
      : "Send one requirement and reach approved professionals matching this service category.";
  const subcategoryCards = serviceGroup ? getGroupSubcategoryCards(serviceGroup) : [];
  const recipientCount = await getBroadcastRecipientCount({
    category: serviceGroup?.name ?? parentGroup?.name ?? category?.name,
    subcategory: category?.name,
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
        <Badge variant="secondary">
          {serviceGroup ? "Service Group" : "Subcategory"}
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
          {pageName} Professionals
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {pageDescription}
        </p>

        {city || area ? (
          <div className="mt-4 flex w-fit items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {[area, city].filter(Boolean).join(", ")}
          </div>
        ) : null}

        <BroadcastRequirementCta
          count={recipientCount}
          category={serviceGroup?.name ?? parentGroup?.name ?? category?.name}
          subcategory={category?.name}
          city={city}
          area={area}
        />

        {serviceGroup ? (
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Choose a specific service
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Message the full {serviceGroup.name} group, or choose one professional type for a more targeted requirement.
              </p>
              <CategoryGrid categories={subcategoryCards} />
            </CardContent>
          </Card>
        ) : parentGroup ? (
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Parent service group
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {category?.name} belongs to {parentGroup.name}. You can also send one broader requirement to every approved professional in this group.
              </p>
              <Button asChild className="mt-4 h-11 w-full sm:w-auto" variant="outline">
                <Link href={`/categories/${categorySlug(parentGroup.name)}`}>
                  View {parentGroup.name}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

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
