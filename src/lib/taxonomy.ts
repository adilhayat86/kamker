import {
  categorySlug,
  findServiceGroupForCategory,
  findServiceGroupBySlug,
} from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type TaxonomyRow = {
  id: number;
};

async function queryByName(table: "cities" | "categories", name: string) {
  if (!isSupabaseConfigured || !supabase || !name) {
    return null;
  }

  const { data, error } = await supabase
    .from(table)
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (error) {
    console.error(`Failed to find ${table} row`, error);
    return null;
  }

  return (data as TaxonomyRow | null)?.id ?? null;
}

export async function findOrCreateCityId(name: string) {
  const cleanName = name.trim();
  const existingId = await queryByName("cities", cleanName);

  if (existingId || !isSupabaseConfigured || !supabase || !cleanName) {
    return existingId;
  }

  const { data, error } = await supabase
    .from("cities")
    .insert({ name: cleanName })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create city row", error);
    return queryByName("cities", cleanName);
  }

  return (data as TaxonomyRow | null)?.id ?? null;
}

async function findOrCreateParentCategoryId(categoryName: string) {
  const serviceGroup = findServiceGroupForCategory(categoryName);

  if (!serviceGroup) {
    return null;
  }

  const existingId = await queryByName("categories", serviceGroup.name);

  if (existingId || !isSupabaseConfigured || !supabase) {
    return existingId;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: serviceGroup.name,
      slug: categorySlug(serviceGroup.name),
      icon: serviceGroup.icon,
      description: serviceGroup.description,
      parent_id: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create parent category row", error);
    return queryByName("categories", serviceGroup.name);
  }

  return (data as TaxonomyRow | null)?.id ?? null;
}

export async function findOrCreateCategoryId(name: string) {
  const cleanName = name.trim();
  const existingId = await queryByName("categories", cleanName);

  if (existingId || !isSupabaseConfigured || !supabase || !cleanName) {
    return existingId;
  }

  const group = findServiceGroupForCategory(cleanName);
  const parentId = await findOrCreateParentCategoryId(cleanName);
  const explicitGroup = findServiceGroupBySlug(categorySlug(cleanName));
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: cleanName,
      slug: categorySlug(cleanName),
      icon: group?.icon ?? explicitGroup?.icon ?? "users",
      description: group
        ? `${cleanName} professionals listed on Kamker.`
        : explicitGroup?.description ?? `${cleanName} services listed on Kamker.`,
      parent_id: parentId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create category row", error);
    return queryByName("categories", cleanName);
  }

  return (data as TaxonomyRow | null)?.id ?? null;
}
