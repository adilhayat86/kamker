import {
  categories,
  categoryCountValue,
  serviceGroups,
} from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type BroadcastCountInput = {
  category?: string;
  subcategory?: string;
  city?: string;
  area?: string;
};

type CountableProfessional = {
  area: string | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type CountableCompanyListing = {
  area: string | null;
  city: string | null;
  service_group: string | null;
  category: string | null;
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

function singularize(value: string) {
  return value.endsWith("s") ? value.slice(0, -1) : value;
}

function textMatchesTarget(value: string | null | undefined, targets: string[]) {
  const normalizedValue = normalizeMatchValue(value);

  if (!targets.length) {
    return true;
  }

  if (!normalizedValue) {
    return false;
  }

  return targets.some((target) => {
    const normalizedTarget = normalizeMatchValue(target);
    const singularTarget = singularize(normalizedTarget);
    const singularValue = singularize(normalizedValue);

    return (
      normalizedValue === normalizedTarget ||
      singularValue === singularTarget ||
      normalizedValue.includes(normalizedTarget) ||
      normalizedValue.includes(singularTarget) ||
      normalizedTarget.includes(normalizedValue)
    );
  });
}

function areaMatches(value: string | null | undefined, area?: string) {
  if (!area) {
    return true;
  }

  const normalizedValue = normalizeMatchValue(value);
  const normalizedArea = normalizeMatchValue(area);

  return (
    normalizedValue === normalizedArea ||
    normalizedValue.includes(normalizedArea) ||
    normalizedArea.includes(normalizedValue)
  );
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
  if (!isSupabaseConfigured || !supabase) {
    return demoCountFor(input);
  }

  const [professionalsResult, companyListingsResult] = await Promise.all([
    supabase
      .from("professionals")
      .select("area, cities(name), categories(name)")
      .eq("is_active", true)
      .limit(1000),
    supabase
      .from("company_listings")
      .select("area, city, service_group, category")
      .eq("status", "approved")
      .limit(1000),
  ]);

  if (professionalsResult.error || companyListingsResult.error) {
    console.error(
      "Failed to count broadcast recipients",
      professionalsResult.error ?? companyListingsResult.error,
    );
    return demoCountFor(input);
  }

  const targets = targetServicesFor(input);
  const professionals = (professionalsResult.data ?? []) as unknown as CountableProfessional[];
  const companyListings = (companyListingsResult.data ?? []) as unknown as CountableCompanyListing[];

  const professionalCount = professionals.filter((professional) => {
    const categoryMatch = textMatchesTarget(professional.categories?.name, targets);
    const cityMatch = input.city
      ? textMatchesTarget(professional.cities?.name, [input.city])
      : true;
    const professionalAreaMatches = areaMatches(professional.area, input.area);

    return categoryMatch && cityMatch && professionalAreaMatches;
  }).length;

  const companyListingCount = companyListings.filter((listing) => {
    const categoryMatch =
      textMatchesTarget(listing.category, targets) ||
      textMatchesTarget(listing.service_group, input.category ? [input.category] : []);
    const cityMatch = input.city ? textMatchesTarget(listing.city, [input.city]) : true;
    const listingAreaMatches = areaMatches(listing.area, input.area);

    return categoryMatch && cityMatch && listingAreaMatches;
  }).length;

  const recipientCount = professionalCount + companyListingCount;

  if (recipientCount === 0 && professionals.length + companyListings.length === 0) {
    return demoCountFor(input);
  }

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

  const query = params.toString();

  return query ? `/send-requirement?${query}` : "/send-requirement";
}

export function broadcastButtonText({
  count,
  category,
  subcategory,
  city,
  area,
}: BroadcastCountInput & {
  count: number;
}) {
  const place = locationLabel(city, area);

  if (subcategory) {
    return `Send Requirement to ${count.toLocaleString()} ${subcategory}${place ? ` in ${place}` : ""}`;
  }

  if (category) {
    return `Send Requirement to ${count.toLocaleString()} ${category} Professionals${place ? ` in ${place}` : ""}`;
  }

  return `Send Requirement to ${count.toLocaleString()} Kamker Professionals${place ? ` in ${place}` : ""}`;
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
