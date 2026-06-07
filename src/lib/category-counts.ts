import { categoryCountValue, serviceGroups } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type CountCategory = {
  id?: number;
  name: string;
  parent_id?: number | null;
  count?: string;
};

type ProfessionalCategoryRow = {
  categories: { name: string } | null;
};

type CompanyListingCategoryRow = {
  category: string | null;
  service_group: string | null;
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

function knownSubcategoriesFor(name: string) {
  const group = serviceGroups.find((item) => normalize(item.name) === normalize(name));

  return group?.subcategories ?? [];
}

export function fallbackCategoryCount(category: CountCategory) {
  if (!category.count) {
    return "";
  }

  const value = categoryCountValue(category.count);

  return value > 0 ? value.toLocaleString("en-PK") : "";
}

export async function getLiveCategoryCountMap(categories: CountCategory[]) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const [professionalsResult, staffResult] = await Promise.all([
    supabase
      .from("professionals")
      .select("categories(name)")
      .eq("is_active", true)
      .limit(5000),
    supabase
      .from("company_listings")
      .select("category, service_group")
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

  const directCounts = new Map<string, number>();

  ((professionalsResult.data ?? []) as unknown as ProfessionalCategoryRow[]).forEach(
    (row) => increment(directCounts, row.categories?.name),
  );
  ((staffResult.data ?? []) as unknown as CompanyListingCategoryRow[]).forEach((row) => {
    increment(directCounts, row.category);
    increment(directCounts, row.service_group);
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
    const childTotal = childNames.reduce(
      (total, childName) => total + (directCounts.get(normalize(childName)) ?? 0),
      0,
    );
    const ownTotal = directCounts.get(key) ?? 0;

    result.set(key, ownTotal + childTotal);
  });

  return result;
}

export function countForCategory(
  category: CountCategory,
  countMap: Map<string, number> | null,
) {
  const liveCount = countMap?.get(normalize(category.name));

  if (typeof liveCount === "number") {
    return liveCount > 0 ? liveCount.toLocaleString("en-PK") : "";
  }

  return fallbackCategoryCount(category);
}
