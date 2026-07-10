import { cities as fallbackCities } from "@/lib/marketplace-data";
import { getPublicCityLookup } from "@/lib/public-directory-lookups";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function getCityOptions() {
  if (!isSupabaseConfigured || !supabase) {
    return fallbackCities;
  }

  const cities = await getPublicCityLookup();
  const dbCities = cities
    .map((city) => city.name?.trim())
    .filter((city): city is string => Boolean(city));

  if (dbCities.length === 0) {
    return fallbackCities;
  }

  return Array.from(new Set([...fallbackCities, ...dbCities])).sort((a, b) =>
    a.localeCompare(b),
  );
}
