import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BroadcastRequirementCta } from "@/components/broadcast-requirement-cta";
import { CategoryGrid } from "@/components/category-grid";
import { Button } from "@/components/ui/button";
import { getBroadcastRecipientCount } from "@/lib/broadcast";
import { categories } from "@/lib/marketplace-data";

export const metadata = {
  title: "All Categories | Kamker",
  description: "Browse all Kamker service categories across Pakistan.",
};

type CategoriesPageProps = {
  searchParams?: Promise<{
    city?: string;
    area?: string;
  }>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const city = params?.city?.trim() || undefined;
  const area = params?.area?.trim() || undefined;
  const recipientCount = await getBroadcastRecipientCount({ city, area });

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
            <Link href="/">
              <ArrowLeft aria-hidden="true" />
              Home
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">
          All services
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-normal">
          Browse all categories
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Find verified professionals for home, office, education, health,
          events, repairs, and daily service needs across Pakistan.
        </p>

        <BroadcastRequirementCta
          count={recipientCount}
          city={city}
          area={area}
        />

        <CategoryGrid categories={categories} />
      </section>
    </main>
  );
}
