import Link from "next/link";
import { redirect } from "next/navigation";

import {
  makeCompanyListingFeatured,
  makeProfessionalFeatured,
  removeCompanyListingFeatured,
  removeProfessionalFeatured,
} from "@/app/admin/actions";
import {
  AdminEmptyState,
  AdminSection,
  AdminShell,
  AdminStatCard,
  AdminStatusBadge,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { getAdminCountSummary } from "@/lib/admin-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Featured Placements | Kamker Admin",
};

export const dynamic = "force-dynamic";
const FEATURED_PREVIEW_LIMIT = 20;

type FeaturedWorker = {
  id: string;
  full_name: string;
  is_featured: boolean;
  featured_until: string | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type FeaturedStaff = {
  id: string;
  title: string;
  category: string;
  city: string;
  status: string;
  is_featured: boolean;
  companies: { id: string; company_name: string } | null;
};

async function getFeaturedWorkers() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as FeaturedWorker[];
  }

  const { data, error } = await supabase
    .from("professionals")
    .select("id, full_name, is_featured, featured_until, cities(name), categories(name)")
    .eq("is_active", true)
    .eq("is_banned", false)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(FEATURED_PREVIEW_LIMIT);

  if (error) {
    console.error("Failed to load featured workers", error);
    return [] as FeaturedWorker[];
  }

  return (data ?? []) as unknown as FeaturedWorker[];
}

async function getFeaturedCompanyStaff() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as FeaturedStaff[];
  }

  const { data, error } = await supabase
    .from("company_listings")
    .select("id, title, category, city, status, is_featured, companies(id, company_name)")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(FEATURED_PREVIEW_LIMIT);

  if (error) {
    console.error("Failed to load featured company staff", error);
    return [] as FeaturedStaff[];
  }

  return (data ?? []) as unknown as FeaturedStaff[];
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default async function AdminFeaturedPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const [summary, workers, staff] = await Promise.all([
    getAdminCountSummary(),
    getFeaturedWorkers(),
    getFeaturedCompanyStaff(),
  ]);

  return (
    <AdminShell
      active="/admin/featured"
      title="Featured Placements"
      description="Manage paid or manually boosted worker and company-managed staff visibility."
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Featured placement management needs production database rows.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Featured Workers" value={summary.activeFeaturedWorkers} />
        <AdminStatCard label="Featured Company Staff" value={summary.activeFeaturedCompanyStaff} />
        <AdminStatCard label="Total Featured" value={summary.activeFeaturedWorkers + summary.activeFeaturedCompanyStaff} />
      </div>

      <AdminSection
        title="Worker Featured Profiles"
        description={`Showing the latest ${FEATURED_PREVIEW_LIMIT} workers for quick action. Use Workers for deeper filtering.`}
      >
        <div className="grid gap-3">
          {workers.length > 0 ? (
            workers.map((worker) => (
              <div key={worker.id} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_240px_140px_150px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{worker.full_name}</p>
                    <AdminStatusBadge>{worker.is_featured ? "Featured" : "Regular"}</AdminStatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {worker.categories?.name ?? "Professional"} - {worker.cities?.name ?? "Unknown city"}
                  </p>
                  <Link href={`/professionals/${worker.id}`} className="mt-2 inline-flex text-sm font-medium text-primary hover:underline">
                    Public profile
                  </Link>
                </div>
                <form action={makeProfessionalFeatured} className="contents">
                  <input type="hidden" name="professionalId" value={worker.id} />
                  <input
                    name="featuredUntil"
                    type="date"
                    defaultValue={dateInputValue(worker.featured_until)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button disabled={!adminAuthenticated}>Make Featured</Button>
                </form>
                <form action={removeProfessionalFeatured}>
                  <input type="hidden" name="professionalId" value={worker.id} />
                  <Button className="w-full" variant="outline" disabled={!adminAuthenticated || !worker.is_featured}>Remove</Button>
                </form>
              </div>
            ))
          ) : (
            <AdminEmptyState>No approved workers found.</AdminEmptyState>
          )}
        </div>
      </AdminSection>

      <AdminSection
        title="Company Staff Featured Profiles"
        description={`Showing the latest ${FEATURED_PREVIEW_LIMIT} company-managed staff profiles while package limits remain enforced by server actions.`}
      >
        <div className="grid gap-3">
          {staff.length > 0 ? (
            staff.map((listing) => (
              <div key={listing.id} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_150px_150px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{listing.title}</p>
                    <AdminStatusBadge>{listing.status}</AdminStatusBadge>
                    <AdminStatusBadge>{listing.is_featured ? "Featured" : "Regular"}</AdminStatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {listing.category} - {listing.city} - {listing.companies?.company_name ?? "Unknown company"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm font-medium text-primary">
                    <Link href={`/company-listings/${listing.id}`} className="hover:underline">Worker profile</Link>
                    {listing.companies?.id ? (
                      <Link href={`/companies/${listing.companies.id}`} className="hover:underline">Company profile</Link>
                    ) : null}
                  </div>
                </div>
                <form action={makeCompanyListingFeatured}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Button className="w-full" disabled={!adminAuthenticated || listing.status !== "approved" || listing.is_featured}>Make Featured</Button>
                </form>
                <form action={removeCompanyListingFeatured}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Button className="w-full" variant="outline" disabled={!adminAuthenticated || !listing.is_featured}>Remove</Button>
                </form>
              </div>
            ))
          ) : (
            <AdminEmptyState>No company staff profiles found.</AdminEmptyState>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
