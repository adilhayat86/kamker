import { unstable_cache } from "next/cache";

import {
  aliasesForCategory,
  categories as fallbackCategories,
  categorySlug,
  searchTermsForCategory,
} from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type CityLookupRow = {
  id: number;
  name: string | null;
};

type CategoryLookupRow = {
  id: number;
  name: string | null;
  slug: string | null;
  parent_id: number | null;
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function singular(value: string) {
  return value.replace(/s$/, "");
}

export const getPublicCityLookup = unstable_cache(
  async () => {
    if (!isSupabaseConfigured || !supabase) {
      return [] as CityLookupRow[];
    }

    const { data, error } = await supabase
      .from("cities")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load public city lookup", error);
      return [] as CityLookupRow[];
    }

    return (data ?? []) as CityLookupRow[];
  },
  ["public-city-lookup"],
  { revalidate: 120 },
);

export const getPublicCategoryLookup = unstable_cache(
  async () => {
    if (!isSupabaseConfigured || !supabase) {
      return [] as CategoryLookupRow[];
    }

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to load public category lookup", error);
      return [] as CategoryLookupRow[];
    }

    return (data ?? []) as CategoryLookupRow[];
  },
  ["public-category-lookup"],
  { revalidate: 120 },
);

export async function getCityIdByName(cityName: string) {
  if (!cityName) {
    return null;
  }

  const cityKey = normalize(cityName);
  const cities = await getPublicCityLookup();
  return cities.find((city) => normalize(city.name) === cityKey)?.id ?? null;
}

export async function getCategoryIdsByNames(categoryNames: string[]) {
  if (categoryNames.length === 0) {
    return [] as number[];
  }

  const categoryKeys = new Set(
    categoryNames.flatMap((name) => {
      const normalized = normalize(name);
      const fallbackCategory = fallbackCategories.find(
        (category) => normalize(category.name) === normalized,
      );
      const aliasTerms = fallbackCategory
        ? aliasesForCategory(fallbackCategory.name).map(normalize)
        : [];

      return [normalized, singular(normalized), ...aliasTerms];
    }),
  );
  const dbCategories = await getPublicCategoryLookup();

  return dbCategories
    .filter((category) => {
      const nameKey = normalize(category.name);
      const slugKey = normalize(categorySlug(category.name ?? ""));
      return (
        categoryKeys.has(nameKey) ||
        categoryKeys.has(singular(nameKey)) ||
        categoryKeys.has(slugKey)
      );
    })
    .map((category) => category.id);
}

export function categoryNamesForSearch(value: string) {
  const valueKey = normalize(value);

  if (!valueKey) {
    return [] as string[];
  }

  return fallbackCategories
    .filter((category) => {
      const nameKey = normalize(category.name);
      const slugKey = normalize(categorySlug(category.name));
      const singularName = singular(nameKey);
      const searchableTerms = searchTermsForCategory(category.name).map(normalize);

      return (
        nameKey.includes(valueKey) ||
        singularName.includes(valueKey) ||
        valueKey.includes(nameKey) ||
        valueKey.includes(singularName) ||
        slugKey === valueKey ||
        searchableTerms.some((term) => {
          const singularTerm = singular(term);

          return (
            term.includes(valueKey) ||
            singularTerm.includes(valueKey) ||
            valueKey.includes(term) ||
            valueKey.includes(singularTerm)
          );
        })
      );
    })
    .map((category) => category.name);
}
