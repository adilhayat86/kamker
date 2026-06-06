import { getLocalCompanyListingRecords, isLocalDemoStoreEnabled } from "@/lib/local-demo-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type ActiveCompanySubscription = {
  id: string;
  company_id: string;
  package_key: string;
  listings_limit: number;
  featured_limit: number;
  expires_at: string;
  package_title: string;
};

type SubscriptionRow = {
  id: string;
  company_id: string;
  package_key: string;
  listings_limit: number;
  featured_limit: number;
  expires_at: string;
  company_packages: { title: string } | { title: string }[] | null;
};

function packageTitle(row: SubscriptionRow) {
  const relatedPackage = Array.isArray(row.company_packages)
    ? row.company_packages[0]
    : row.company_packages;

  return relatedPackage?.title ?? row.package_key;
}

export async function getActiveCompanySubscription(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    if (isLocalDemoStoreEnabled && companyId.startsWith("local-company-")) {
      return {
        id: `${companyId}-local-demo-subscription`,
        company_id: companyId,
        package_key: "company_growth_monthly",
        listings_limit: 50,
        featured_limit: 15,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        package_title: "Growth Company",
      } satisfies ActiveCompanySubscription;
    }

    return null;
  }

  const { data, error } = await supabase
    .from("company_package_subscriptions")
    .select(
      "id, company_id, package_key, listings_limit, featured_limit, expires_at, company_packages(title)",
    )
    .eq("company_id", companyId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load active company subscription", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as unknown as SubscriptionRow;

  return {
    id: row.id,
    company_id: row.company_id,
    package_key: row.package_key,
    listings_limit: row.listings_limit,
    featured_limit: row.featured_limit,
    expires_at: row.expires_at,
    package_title: packageTitle(row),
  } satisfies ActiveCompanySubscription;
}

export async function getPublishedCompanyListingUsage(companyId: string) {
  if (!isSupabaseConfigured || !supabase) {
    if (isLocalDemoStoreEnabled && companyId.startsWith("local-company-")) {
      const listings = await getLocalCompanyListingRecords(companyId);
      const approved = listings.filter((listing) => listing.status === "approved");

      return {
        published: approved.length,
        featured: approved.filter((listing) => listing.is_featured).length,
      };
    }

    return { published: 0, featured: 0 };
  }

  const [{ count: published, error: publishedError }, { count: featured, error: featuredError }] =
    await Promise.all([
      supabase
        .from("company_listings")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "approved"),
      supabase
        .from("company_listings")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "approved")
        .eq("is_featured", true),
    ]);

  if (publishedError) {
    console.error("Failed to count published company listings", publishedError);
  }

  if (featuredError) {
    console.error("Failed to count featured company listings", featuredError);
  }

  return {
    published: published ?? 0,
    featured: featured ?? 0,
  };
}
