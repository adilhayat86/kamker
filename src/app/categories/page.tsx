import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ArrowLeft, Search } from "lucide-react";

import { CategoryGrid } from "@/components/category-grid";
import { KamkerLogo } from "@/components/kamker-logo";
import { Button } from "@/components/ui/button";
import { countForCategory, getLiveCategoryCountMap } from "@/lib/category-counts";
import { getCityOptions } from "@/lib/city-options";
import {
  categories,
  parentCategories,
  searchTermsForCategory,
} from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "All Categories | Kamker",
  description: "Browse all Kamker service categories across Pakistan.",
};

export const revalidate = 120;

type CategoriesPageProps = {
  searchParams?: Promise<{
    city?: string;
    area?: string;
    q?: string;
  }>;
};

type DbCategoryCard = {
  id: number;
  name: string;
  count: string;
  icon: string;
  parent_id: number | null;
};

const getSupabaseCategoryCards = unstable_cache(async function getSupabaseCategoryCards() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as DbCategoryCard[];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, parent_id")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load public Supabase categories", error);
    return [] as DbCategoryCard[];
  }

  return ((data ?? []) as Array<{ id: number; name: string; icon: string | null; parent_id: number | null }>).map((category) => ({
    id: category.id,
    name: category.name,
    icon: category.icon ?? "wrench",
    count: "",
    parent_id: category.parent_id,
  }));
}, ["public-category-cards"], { revalidate: 120 });

function uniqueCategoryCards<T extends { name: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.name.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizedText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function categoryMatchesQuery(categoryName: string, query: string) {
  const queryKey = normalizedText(query);

  if (!queryKey) {
    return true;
  }

  const terms = searchTermsForCategory(categoryName).map(normalizedText);
  const nameKey = normalizedText(categoryName);

  return [nameKey, ...terms].some(
    (term) => term.includes(queryKey) || queryKey.includes(term),
  );
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const city = params?.city?.trim() || undefined;
  const area = params?.area?.trim() || undefined;
  const q = params?.q?.trim() || "";
  const [dbCategories, cityOptions] = await Promise.all([
    getSupabaseCategoryCards(),
    getCityOptions(),
  ]);
  const liveCountMap = await getLiveCategoryCountMap(
    [
      ...dbCategories,
      ...categories,
      ...parentCategories,
    ],
    { city, area },
  );
  const countedDbCategories = dbCategories.map((category) => ({
    ...category,
    count: countForCategory(category, liveCountMap),
  }));
  const countedLocalCategories = categories.map((category) => ({
    ...category,
    count: countForCategory(category, liveCountMap),
  }));
  const countedParentCategories = parentCategories.map((category) => ({
    ...category,
    count: countForCategory(category, liveCountMap),
  }));
  const dbParentCategories = countedDbCategories.filter((category) => category.parent_id === null);
  const dbSubcategories = countedDbCategories.filter((category) => category.parent_id !== null);
  const normalizedQuery = q.toLowerCase();
  const searchableCategories = q
    ? uniqueCategoryCards([...dbSubcategories, ...dbParentCategories, ...countedLocalCategories, ...countedParentCategories])
    : uniqueCategoryCards([...dbParentCategories, ...countedParentCategories]);
  const visibleCategories = q
    ? searchableCategories.filter((category) => categoryMatchesQuery(category.name, normalizedQuery))
    : searchableCategories;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 pr-16 sm:px-6 sm:pr-20 lg:px-8 lg:pr-20">
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
                {cityOptions.map((cityOption) => (
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
