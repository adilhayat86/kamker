import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

import { BroadcastRequirementCta } from "@/components/broadcast-requirement-cta";
import { CategoryGrid } from "@/components/category-grid";
import { KamkerLogo } from "@/components/kamker-logo";
import { Button } from "@/components/ui/button";
import { getBroadcastRecipientCount } from "@/lib/broadcast";
import { categories, cities, parentCategories } from "@/lib/marketplace-data";

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
  const normalizedQuery = q.toLowerCase();
  const searchableCategories = q ? [...categories, ...parentCategories] : parentCategories;
  const visibleCategories = q
    ? searchableCategories.filter((category) =>
        category.name.toLowerCase().includes(normalizedQuery),
      )
    : parentCategories;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <KamkerLogo />
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
                placeholder="Nurses, tutors, drivers, AC maintenance"
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

        {visibleCategories.length > 0 ? (
          <CategoryGrid categories={visibleCategories} city={city} area={area} />
        ) : (
          <div className="mt-5 rounded-lg border bg-white p-5 text-sm text-muted-foreground shadow-sm">
            No services matched &quot;{q}&quot;. Try Nurses, Maids, Drivers, Tutors, or AC Maintenance.
          </div>
        )}
      </section>
    </main>
  );
}
