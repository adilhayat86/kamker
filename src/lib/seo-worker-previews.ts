import { unstable_cache } from "next/cache";

import { getCategoryIdsByNames, getCityIdByName } from "@/lib/public-directory-lookups";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type SeoWorkerPreview = {
  id: string;
  full_name: string;
  area: string | null;
  availability: string | null;
  short_bio: string | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

// Only public directory fields are loaded. Keep city pages fast without using
// sample workers when the database is unavailable or a search has no matches.
export const getSeoWorkerPreviews = unstable_cache(
  async (city: string, category: string | null): Promise<SeoWorkerPreview[]> => {
    if (!isSupabaseConfigured || !supabase) return [];
    const [cityId, categoryIds] = await Promise.all([
      getCityIdByName(city),
      category ? getCategoryIdsByNames([category]) : Promise.resolve(null),
    ]);
    if (cityId === null || (categoryIds !== null && categoryIds.length === 0)) return [];

    let query = supabase.from("professionals")
      .select("id, full_name, area, availability, short_bio, cities(name), categories(name)")
      .eq("is_active", true)
      .or("is_banned.eq.false,is_banned.is.null")
      .eq("city_id", cityId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(6);
    if (categoryIds !== null) query = query.in("category_id", categoryIds);
    const { data, error } = await query;
    if (error) {
      console.error("Failed to load public city worker previews", error);
      return [];
    }
    return (data ?? []) as unknown as SeoWorkerPreview[];
  },
  ["seo-city-worker-previews-v1"],
  { revalidate: 120 },
);
