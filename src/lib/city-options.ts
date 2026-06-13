import { unstable_cache } from "next/cache";

import { cities as fallbackCities } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type CityRow = {
  name: string | null;
};

function isExpectedCityFetchFailure(error: { message?: string; details?: string }) {
  return (
    error.message?.includes("fetch failed") ||
    error.details?.includes("fetch failed")
  );
}

export const getCityOptions = unstable_cache(async function getCityOptions() {
  if (!isSupabaseConfigured || !supabase) {
    return fallbackCities;
  }

  const { data, error } = await supabase
    .from("cities")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    if (!isExpectedCityFetchFailure(error)) {
      console.error("Failed to load city options", error);
    }

    return fallbackCities;
  }

  const dbCities = ((data ?? []) as CityRow[])
    .map((city) => city.name?.trim())
    .filter((city): city is string => Boolean(city));

  return Array.from(new Set([...fallbackCities, ...dbCities])).sort((a, b) =>
    a.localeCompare(b),
  );
}, ["city-options"], { revalidate: 120 });
