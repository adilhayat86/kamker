import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { BroadcastRequirementCta } from "@/components/broadcast-requirement-cta";
import { CategoryGrid } from "@/components/category-grid";
import { Button } from "@/components/ui/button";
import { getBroadcastRecipientCount } from "@/lib/broadcast";
import { cities, parentCategories } from "@/lib/marketplace-data";

export const metadata = {
  title: "All Categories | Kamker",
  description: "Browse all Kamker service categories across Pakistan.",
};

type CategoriesPageProps = {
  searchParams?: Promise<{
    city?: string;
    area?: string;
    q?: string;
  }>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const city = params?.city?.trim() || undefined;
  const area = params?.area?.trim() || undefined;
  const q = params?.q?.trim() || "";
  const recipientCount = await getBroadcastRecipientCount({ city, area });
  const visibleCategories = q
    ? parentCategories.filter((category) =>
        category.name.toLowerCase().includes(q.toLowerCase()),
      )
    : parentCategories;

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
          Browse service groups
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Start with a broad group like Healthcare, Education, or Home Repairs,
          then choose a specific professional type such as Nurses or Electricians.
        </p>

        <BroadcastRequirementCta
          count={recipientCount}
          city={city}
          area={area}
        />

        <form className="mt-6 rounded-lg border bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
            <label className="grid gap-1">
              <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Find service group
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Healthcare, Education, Repairs"
                className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                City
              </span>
              <select
                name="city"
                defaultValue={city ?? ""}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All cities</option>
                {cities.map((cityOption) => (
                  <option key={cityOption} value={cityOption}>
                    {cityOption}
                  </option>
                ))}
              </select>
            </label>
            <Button className="h-11 self-end" type="submit">
              <Search aria-hidden="true" />
              Search
            </Button>
          </div>
        </form>

        <CategoryGrid categories={visibleCategories} />
      </section>
    </main>
  );
}
