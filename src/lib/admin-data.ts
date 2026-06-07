import { isAdminPasswordConfigured } from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AdminCountSummary = {
  pendingWorkers: number;
  approvedWorkers: number;
  pendingCompanies: number;
  verifiedCompanies: number;
  pendingCompanyStaff: number;
  approvedCompanyStaff: number;
  pendingProofs: number;
  newRequirements: number;
  activeFeaturedWorkers: number;
  activeFeaturedCompanyStaff: number;
  activeCompanyPackages: number;
  todayCallClicks: number;
  todayWhatsappClicks: number;
};

export type AdminRequirementRow = {
  id: string;
  required_service: string;
  area: string | null;
  urgency: string;
  status: string;
  created_at: string;
  cities: { name: string } | null;
  matched_count?: number;
};

export type AdminAnalyticsRow = {
  event_type: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SystemHealth = {
  adminAuth: boolean;
  supabase: boolean;
  databaseSchema: boolean;
  openai: boolean;
  whatsapp: boolean;
};

async function countRows(table: string, filters: Record<string, string | boolean | null> = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return 0;
  }

  let query = supabase.from(table).select("id", { count: "exact", head: true });

  Object.entries(filters).forEach(([key, value]) => {
    query = value === null ? query.is(key, null) : query.eq(key, value);
  });

  const { count, error } = await query;

  if (error) {
    console.error(`Failed to count ${table}`, error);
    return 0;
  }

  return count ?? 0;
}

async function countRowsIn(table: string, column: string, values: string[]) {
  if (!isSupabaseConfigured || !supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .in(column, values);

  if (error) {
    console.error(`Failed to count ${table} where ${column} is in list`, error);
    return 0;
  }

  return count ?? 0;
}

export async function getAdminCountSummary(): Promise<AdminCountSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!isSupabaseConfigured || !supabase) {
    return {
      pendingWorkers: 0,
      approvedWorkers: 0,
      pendingCompanies: 0,
      verifiedCompanies: 0,
      pendingCompanyStaff: 0,
      approvedCompanyStaff: 0,
      pendingProofs: 0,
      newRequirements: 0,
      activeFeaturedWorkers: 0,
      activeFeaturedCompanyStaff: 0,
      activeCompanyPackages: 0,
      todayCallClicks: 0,
      todayWhatsappClicks: 0,
    };
  }

  const [
    pendingWorkers,
    approvedWorkers,
    pendingCompanies,
    verifiedCompanies,
    pendingCompanyStaff,
    approvedCompanyStaff,
    pendingProofs,
    newRequirements,
    activeFeaturedWorkers,
    activeFeaturedCompanyStaff,
    activeCompanyPackages,
    todayCallClicks,
    todayWhatsappClicks,
  ] = await Promise.all([
    countRows("professionals", { is_active: false }),
    countRows("professionals", { is_active: true }),
    countRows("companies", { verification_status: "pending" }),
    countRows("companies", { verification_status: "verified" }),
    countRows("company_listings", { status: "pending" }),
    countRows("company_listings", { status: "approved" }),
    countRows("proof_reviews", { audit_status: "unchecked" }),
    countRowsIn("requirements", "status", ["open", "new"]),
    countRows("professionals", { is_featured: true }),
    countRows("company_listings", { is_featured: true }),
    countRows("company_package_subscriptions", { status: "active" }),
    countAnalyticsSince("call_click", today.toISOString()),
    countAnalyticsSince("whatsapp_click", today.toISOString()),
  ]);

  return {
    pendingWorkers,
    approvedWorkers,
    pendingCompanies,
    verifiedCompanies,
    pendingCompanyStaff,
    approvedCompanyStaff,
    pendingProofs,
    newRequirements,
    activeFeaturedWorkers,
    activeFeaturedCompanyStaff,
    activeCompanyPackages,
    todayCallClicks,
    todayWhatsappClicks,
  };
}

async function countAnalyticsSince(eventType: string, since: string) {
  if (!isSupabaseConfigured || !supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", eventType)
    .gte("created_at", since);

  if (error) {
    console.error("Failed to count analytics events", error);
    return 0;
  }

  return count ?? 0;
}

export async function getRecentRequirements(limit = 8) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as AdminRequirementRow[];
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("id, required_service, area, urgency, status, created_at, cities(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load admin requirements", error);
    return [] as AdminRequirementRow[];
  }

  const requirements = (data ?? []) as unknown as AdminRequirementRow[];
  const requirementIds = requirements.map((requirement) => requirement.id);

  if (requirementIds.length === 0) {
    return requirements;
  }

  const { data: matches } = await supabase
    .from("requirement_matches")
    .select("requirement_id")
    .in("requirement_id", requirementIds);

  const counts = new Map<string, number>();
  ((matches ?? []) as { requirement_id: string }[]).forEach((match) => {
    counts.set(match.requirement_id, (counts.get(match.requirement_id) ?? 0) + 1);
  });

  return requirements.map((requirement) => ({
    ...requirement,
    matched_count: counts.get(requirement.id) ?? 0,
  }));
}

export async function getRecentAnalyticsEvents(days = 7, limit = 500) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as AdminAnalyticsRow[];
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, target_type, target_id, metadata, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load analytics events", error);
    return [] as AdminAnalyticsRow[];
  }

  return (data ?? []) as unknown as AdminAnalyticsRow[];
}

export function groupCount(values: string[]) {
  return values.reduce<Record<string, number>>((accumulator, value) => {
    const key = value || "Unknown";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

export async function getSystemHealth() {
  const configured: SystemHealth = {
    adminAuth: isAdminPasswordConfigured(),
    supabase: isSupabaseConfigured,
    databaseSchema: false,
    openai: Boolean(process.env.OPENAI_API_KEY),
    whatsapp:
      Boolean(process.env.WHATSAPP_ACCESS_TOKEN) &&
      Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      Boolean(process.env.KAMKER_ADMIN_WHATSAPP),
  };

  if (isSupabaseConfigured && supabase) {
    configured.databaseSchema = await isDatabaseSchemaReady();
  }

  return configured;
}

async function hasReadableTable(table: string) {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from(table)
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (error) {
    console.error(`Admin system health table check failed for ${table}`, error);
    return false;
  }

  return true;
}

async function hasCompanyStaffRequirementMatchColumn() {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase
    .from("requirement_matches")
    .select("company_listing_id")
    .limit(1);

  if (error) {
    console.error(
      "Admin system health column check failed for requirement_matches.company_listing_id",
      error,
    );
    return false;
  }

  return true;
}

async function isDatabaseSchemaReady() {
  const requiredTables = [
    "professionals",
    "customers",
    "requirements",
    "requirement_matches",
    "companies",
    "company_package_subscriptions",
    "company_listings",
    "proof_reviews",
    "analytics_events",
    "whatsapp_messages",
  ];

  const checks = await Promise.all([
    ...requiredTables.map(hasReadableTable),
    hasCompanyStaffRequirementMatchColumn(),
  ]);

  return checks.every(Boolean);
}
