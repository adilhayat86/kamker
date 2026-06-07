import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminCity, updateAdminCity } from "@/app/admin/actions";
import {
  AdminEmptyState,
  AdminSection,
  AdminShell,
  AdminStatCard,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Cities | Kamker Admin",
};

export const dynamic = "force-dynamic";

type CityRow = {
  id: number;
  name: string;
  created_at: string;
};

async function getAdminCities() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CityRow[];
  }

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load admin cities", error);
    return [] as CityRow[];
  }

  return (data ?? []) as CityRow[];
}

export default async function AdminCitiesPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const cities = await getAdminCities();
  const newestCities = [...cities]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <AdminShell
      active="/admin/cities"
      title="Cities"
      description="Add cities that should appear in Kamker registration, search, categories, and requirement forms."
      actions={
        <Button asChild variant="outline">
          <Link href="/professionals">Test City Search</Link>
        </Button>
      }
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Admin-added cities require the Supabase cities table. Built-in fallback
          cities still show publicly in local/demo mode.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Managed Cities" value={cities.length} />
        <AdminStatCard
          label="Newest City"
          value={newestCities[0]?.name ?? "None"}
          helper="Most recently added city"
        />
        <AdminStatCard
          label="Public Forms"
          value="Live"
          helper="Registration and search read this list"
          tone="good"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <AdminSection
          title="Add City"
          description="Add one city at a time. Keep spellings clean because users will search and filter by this value."
        >
          <form action={createAdminCity} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">City name</span>
              <input
                name="name"
                placeholder="Multan"
                required
                className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              />
            </label>
            <Button disabled={!adminAuthenticated || !isSupabaseConfigured}>
              Add City
            </Button>
          </form>
        </AdminSection>

        <AdminSection
          title="Recent Cities"
          description="Quick check of newly added city options."
        >
          {newestCities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {newestCities.map((city) => (
                <Link
                  key={city.id}
                  href={`/professionals?city=${encodeURIComponent(city.name)}`}
                  className="rounded-full border bg-slate-50 px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          ) : (
            <AdminEmptyState>No cities have been added yet.</AdminEmptyState>
          )}
        </AdminSection>
      </div>

      <AdminSection
        title="Managed City List"
        description="Rename cities here when spellings need correction. Existing profiles keep working because they reference the city row."
      >
        {cities.length > 0 ? (
          <div className="grid gap-3">
            {cities.map((city) => (
              <form
                key={city.id}
                action={updateAdminCity}
                className="grid gap-2 rounded-lg border bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto]"
              >
                <input type="hidden" name="cityId" value={city.id} />
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    City
                  </span>
                  <input
                    name="name"
                    defaultValue={city.name}
                    required
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  />
                </label>
                <Button
                  className="h-10 self-end"
                  disabled={!adminAuthenticated || !isSupabaseConfigured}
                  variant="outline"
                >
                  Save
                </Button>
                <Button
                  asChild
                  className="h-10 self-end"
                  variant="outline"
                >
                  <Link href={`/professionals?city=${encodeURIComponent(city.name)}`}>
                    Test
                  </Link>
                </Button>
              </form>
            ))}
          </div>
        ) : (
          <AdminEmptyState>
            No Supabase-managed cities found yet. Add cities like Multan,
            Faisalabad, Quetta, Hyderabad, or Sialkot as Kamker expands.
          </AdminEmptyState>
        )}
      </AdminSection>
    </AdminShell>
  );
}
