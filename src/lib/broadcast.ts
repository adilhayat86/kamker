import { categories, categoryCountValue } from "@/lib/marketplace-data";
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

export async function getBroadcastRecipientCount(input: BroadcastCountInput) {
  if (!isSupabaseConfigured || !supabase) {
    return demoCountFor(input);
  }

  const { data, error } = await supabase
    .from("professionals")
    .select("area, cities(name), categories(name)")
    .eq("is_active", true)
    .limit(1000);

  if (error) {
    console.error("Failed to count broadcast recipients", error);
    return demoCountFor(input);
  }

  const serviceName = input.subcategory || input.category;
  const professionals = (data ?? []) as unknown as CountableProfessional[];

  return professionals.filter((professional) => {
    const categoryMatch = serviceName
      ? professional.categories?.name === serviceName
      : true;
    const cityMatch = input.city ? professional.cities?.name === input.city : true;
    const areaMatch = input.area
      ? professional.area?.toLowerCase() === input.area.toLowerCase()
      : true;

    return categoryMatch && cityMatch && areaMatch;
  }).length;
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
