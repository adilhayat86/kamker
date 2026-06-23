import {
  categories,
  categoryCountValue,
  serviceGroups,
} from "@/lib/marketplace-data";
import {
  getCategoryIdsByNames,
  getCityIdByName,
} from "@/lib/public-directory-lookups";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getRequirementContextRecipientCount } from "@/lib/category-counts";

type BroadcastCountInput = {
  category?: string;
  subcategory?: string;
  city?: string;
  area?: string;
  scope?: "category" | "serviceGroup";
  estimate?: number;
};

function locationLabel(city?: string, area?: string) {
  if (city && area) {
    return `${area}, ${city}`;
  }

  return city || area || "";
}

function demoCountFor(input: BroadcastCountInput) {
  const serviceName = input.subcategory || input.category;
  const category = categories.find((item) => item.name === serviceName);
  const baseCount = category
    ? categoryCountValue(category.count)
    : categories.reduce((total, item) => total + categoryCountValue(item.count), 0);

  if (input.city && input.area) {
    return Math.max(1, Math.round(baseCount / 18));
  }

  if (input.city || input.area) {
    return Math.max(1, Math.round(baseCount / 7));
  }

  return baseCount;
}

function normalizeMatchValue(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function targetServicesFor(input: BroadcastCountInput) {
  if (input.subcategory) {
    return [input.subcategory];
  }

  if (!input.category) {
    return [];
  }

  const serviceGroup = serviceGroups.find(
    (group) => normalizeMatchValue(group.name) === normalizeMatchValue(input.category),
  );

  return serviceGroup ? serviceGroup.subcategories : [input.category];
}

export async function getBroadcastRecipientCount(input: BroadcastCountInput) {
  const sharedCategoryCount = await getRequirementContextRecipientCount(input);

  if (typeof sharedCategoryCount === "number") {
    return sharedCategoryCount;
  }

  if (!isSupabaseConfigured || !supabase) {
    return demoCountFor(input);
  }

  const supabaseClient = supabase;
  const targets = targetServicesFor(input);
  const [cityId, categoryIds] = await Promise.all([
    input.city ? getCityIdByName(input.city) : Promise.resolve(null),
    getCategoryIdsByNames(targets),
  ]);

  if (input.city && cityId === null) {
    return 0;
  }

  let professionalsQuery = supabaseClient
    .from("professionals")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .or("is_banned.eq.false,is_banned.is.null");

  if (cityId !== null) {
    professionalsQuery = professionalsQuery.eq("city_id", cityId);
  }

  if (categoryIds.length > 0) {
    professionalsQuery = professionalsQuery.in("category_id", categoryIds);
  } else if (targets.length > 0) {
    return 0;
  }

  if (input.area) {
    professionalsQuery = professionalsQuery.ilike("area", `%${input.area}%`);
  }

  const serviceGroup = input.category
    ? serviceGroups.find(
        (group) => normalizeMatchValue(group.name) === normalizeMatchValue(input.category),
      )
    : null;
  let companyListingsQuery = supabaseClient
    .from("company_listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (input.city) {
    companyListingsQuery = companyListingsQuery.eq("city", input.city);
  }

  if (input.area) {
    companyListingsQuery = companyListingsQuery.ilike("area", `%${input.area}%`);
  }

  if (input.subcategory) {
    companyListingsQuery = companyListingsQuery.eq("category", input.subcategory);
  } else if (serviceGroup) {
    companyListingsQuery = companyListingsQuery.in("category", serviceGroup.subcategories);
  } else if (input.category) {
    companyListingsQuery = companyListingsQuery.eq("category", input.category);
  }

  const [professionalsResult, companyListingsResult] = await Promise.all([
    professionalsQuery,
    companyListingsQuery,
  ]);

  if (professionalsResult.error || companyListingsResult.error) {
    console.error(
      "Failed to count broadcast recipients",
      professionalsResult.error ?? companyListingsResult.error,
    );
    return 0;
  }

  const professionalDbCount = professionalsResult.count ?? 0;
  const companyListingDbCount = companyListingsResult.count ?? 0;
  const recipientCount = professionalDbCount + companyListingDbCount;

  return recipientCount;
}

export function buildSendRequirementHref(input: BroadcastCountInput) {
  const params = new URLSearchParams();

  if (input.category) {
    params.set("category", input.category);
  }

  if (input.subcategory) {
    params.set("subcategory", input.subcategory);
  }

  if (input.city) {
    params.set("city", input.city);
  }

  if (input.area) {
    params.set("area", input.area);
  }

  if (typeof input.estimate === "number" && Number.isFinite(input.estimate)) {
    params.set("estimate", String(Math.max(0, Math.floor(input.estimate))));
  }

  const query = params.toString();

  return query ? `/send-requirement?${query}` : "/send-requirement";
}

export function broadcastButtonText({
  count,
  category,
  subcategory,
  city,
  area,
  scope = "category",
}: BroadcastCountInput & {
  count: number;
}) {
  const place = locationLabel(city, area);
  const countLabel = count > 0 ? `${count.toLocaleString()} ` : "";
  const professionalLabel = count === 1 ? "professional" : "professionals";

  if (subcategory) {
    return `Send Requirement to ${countLabel}${subcategory}${place ? ` in ${place}` : ""}`;
  }

  if (scope === "serviceGroup" && category) {
    return `Send Requirement to ${countLabel}${category} ${professionalLabel}${place ? ` in ${place}` : ""}`;
  }

  if (category) {
    return `Send Requirement to ${countLabel}${category} ${professionalLabel}${place ? ` in ${place}` : ""}`;
  }

  return `Send Requirement to ${countLabel}Kamker ${professionalLabel}${place ? ` in ${place}` : ""}`;
}

export function serviceFromBroadcastQuery({
  category,
  subcategory,
}: {
  category?: string;
  subcategory?: string;
}) {
  return categories.find(
    (item) => item.name === subcategory || item.name === category,
  );
}
