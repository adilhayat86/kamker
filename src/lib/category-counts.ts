import { unstable_cache } from "next/cache";

import { getMockCompanyListingCount } from "@/lib/company-listing-cards";
import { categoryCountValue, serviceGroups } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type CountCategory = {
  id?: number;
  name: string;
  parent_id?: number | null;
  count?: string;
};

type ProfessionalCategoryRow = {
  categories: { name: string } | { name: string }[] | null;
  cities: { name: string } | { name: string }[] | null;
  area: string | null;
};

type CompanyListingCategoryRow = {
  category: string | null;
  service_group: string | null;
  city: string | null;
  area: string | null;
};

type CountFilters = {
  city?: string;
  area?: string;
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function increment(map: Map<string, number>, name: string | null | undefined) {
  const key = normalize(name);

  if (!key) {
    return;
  }

  map.set(key, (map.get(key) ?? 0) + 1);
}

function countFor(map: Map<string, number>, name: string | null | undefined) {
  return map.get(normalize(name)) ?? 0;
}

function relationName(
  relation: { name: string | null } | { name: string | null }[] | null | undefined,
) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation?.name ?? null;
}

function matchesLocation(
  row: { city?: string | null; area?: string | null },
  filters?: CountFilters,
) {
  const cityMatch = filters?.city
    ? normalize(row.city) === normalize(filters.city)
    : true;
  const areaMatch = filters?.area
    ? normalize(row.area).includes(normalize(filters.area))
    : true;

  return cityMatch && areaMatch;
}

function knownSubcategoriesFor(name: string) {
  const group = serviceGroups.find((item) => normalize(item.name) === normalize(name));

  return group?.subcategories ?? [];
}

export function fallbackCategoryCount(category: CountCategory) {
  const value = fallbackCategoryCountValue(category);

  return value > 0 ? value.toLocaleString("en-PK") : "";
}

export function fallbackCategoryCountValue(category: CountCategory) {
  if (!category.count) {
    return 0;
  }

  const value = categoryCountValue(category.count);

  return value > 0 ? value : 0;
}

function fallbackCompanyCountForCategory(
  categoryName: string,
  companyCount: number,
  filters?: CountFilters,
) {
  if (companyCount > 0) {
    return 0;
  }

  return getMockCompanyListingCount({
    categories: [categoryName],
    city: filters?.city,
    area: filters?.area,
  });
}

function fallbackCompanyCountForServiceGroup(
  serviceGroupName: string,
  companyCount: number,
  filters?: CountFilters,
) {
  if (companyCount > 0) {
    return 0;
  }

  return getMockCompanyListingCount({
    serviceGroup: serviceGroupName,
    city: filters?.city,
    area: filters?.area,
  });
}

async function loadLiveCategoryCountEntries(
  categories: CountCategory[],
  filters?: CountFilters,
) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const [professionalsResult, staffResult] = await Promise.all([
    supabase
      .from("professionals")
      .select("area, cities(name), categories(name)")
      .eq("is_active", true)
      .eq("is_banned", false)
      .limit(5000),
    supabase
      .from("company_listings")
      .select("category, service_group, city, area")
      .eq("status", "approved")
      .limit(5000),
  ]);

  if (professionalsResult.error || staffResult.error) {
    console.error(
      "Failed to load live category counts",
      professionalsResult.error ?? staffResult.error,
    );
    return null;
  }

  const professionalCounts = new Map<string, number>();
  const companyCounts = new Map<string, number>();
  const companyGroupCounts = new Map<string, number>();

  ((professionalsResult.data ?? []) as unknown as ProfessionalCategoryRow[]).forEach(
    (row) => {
      const cityName = relationName(row.cities);

      if (matchesLocation({ city: cityName, area: row.area }, filters)) {
        increment(professionalCounts, relationName(row.categories));
      }
    },
  );
  ((staffResult.data ?? []) as unknown as CompanyListingCategoryRow[]).forEach((row) => {
    if (matchesLocation({ city: row.city, area: row.area }, filters)) {
      increment(companyCounts, row.category);
      increment(companyGroupCounts, row.service_group);
    }
  });

  const childrenByParentId = new Map<number, string[]>();
  categories.forEach((category) => {
    if (category.parent_id && category.id) {
      const children = childrenByParentId.get(category.parent_id) ?? [];
      children.push(category.name);
      childrenByParentId.set(category.parent_id, children);
    }
  });

  const result = new Map<string, number>();

  categories.forEach((category) => {
    const key = normalize(category.name);
    const childNames = category.id
      ? childrenByParentId.get(category.id) ?? []
      : knownSubcategoriesFor(category.name);
    const ownProfessionalTotal = countFor(professionalCounts, category.name);
    const ownCompanyTotal = countFor(companyCounts, category.name);

    if (childNames.length > 0) {
      const childProfessionalTotal = childNames.reduce(
        (total, childName) => total + countFor(professionalCounts, childName),
        0,
      );
      const groupCompanyTotal =
        countFor(companyGroupCounts, category.name) +
        childNames.reduce(
          (total, childName) => total + countFor(companyCounts, childName),
          0,
        );
      const fallbackGroupCompanyTotal = fallbackCompanyCountForServiceGroup(
        category.name,
        groupCompanyTotal,
        filters,
      );

      result.set(
        key,
        ownProfessionalTotal +
          ownCompanyTotal +
          childProfessionalTotal +
          groupCompanyTotal +
          fallbackGroupCompanyTotal,
      );
      return;
    }

    const fallbackCompanyTotal = fallbackCompanyCountForCategory(
      category.name,
      ownCompanyTotal,
      filters,
    );

    result.set(key, ownProfessionalTotal + ownCompanyTotal + fallbackCompanyTotal);
  });

  return Array.from(result.entries());
}

const getCachedLiveCategoryCountEntries = unstable_cache(
  loadLiveCategoryCountEntries,
  ["live-category-counts"],
  { revalidate: 120 },
);

export async function getLiveCategoryCountMap(
  categories: CountCategory[],
  filters?: CountFilters,
) {
  const entries = await getCachedLiveCategoryCountEntries(categories, filters);
  return entries ? new Map(entries) : null;
}

export function countForCategory(
  category: CountCategory,
  countMap: Map<string, number> | null,
) {
  const value = countNumberForCategory(category, countMap);

  return value > 0 ? value.toLocaleString("en-PK") : "";
}

export function countNumberForCategory(
  category: CountCategory,
  countMap: Map<string, number> | null,
) {
  const liveCount = countMap?.get(normalize(category.name));

  if (typeof liveCount === "number") {
    return liveCount > 0 ? liveCount : 0;
  }

  return fallbackCategoryCountValue(category);
}
