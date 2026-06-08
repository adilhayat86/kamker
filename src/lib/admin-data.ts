import { isAdminPasswordConfigured } from "@/lib/admin-auth";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
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
  storageBuckets: boolean;
  cloudinary: boolean;
  openai: boolean;
  whatsapp: boolean;
  missingTables: string[];
  missingColumns: string[];
  missingBuckets: string[];
  bucketIssues: string[];
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
    storageBuckets: false,
    cloudinary: isCloudinaryConfigured,
    openai: Boolean(process.env.OPENAI_API_KEY),
    whatsapp:
      Boolean(process.env.WHATSAPP_ACCESS_TOKEN) &&
      Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      Boolean(process.env.KAMKER_ADMIN_WHATSAPP),
    missingTables: [],
    missingColumns: [],
    missingBuckets: [],
    bucketIssues: [],
  };

  if (isSupabaseConfigured && supabase) {
    const [databaseReadiness, storageReadiness] = await Promise.all([
      getDatabaseSchemaReadiness(),
      getStorageBucketReadiness(),
    ]);

    configured.databaseSchema = databaseReadiness.ready;
    configured.storageBuckets = storageReadiness.ready;
    configured.missingTables = databaseReadiness.missingTables;
    configured.missingColumns = databaseReadiness.missingColumns;
    configured.missingBuckets = storageReadiness.missingBuckets;
    configured.bucketIssues = storageReadiness.bucketIssues;
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

async function hasReadableColumn(table: string, column: string) {
  if (!supabase) {
    return false;
  }

  const { error } = await supabase.from(table).select(column).limit(1);

  if (error) {
    console.error(`Admin system health column check failed for ${table}.${column}`, error);
    return false;
  }

  return true;
}

async function getDatabaseSchemaReadiness() {
  const requiredTables = [
    "professionals",
    "customers",
    "categories",
    "cities",
    "requirements",
    "requirement_matches",
    "companies",
    "company_packages",
    "manual_payments",
    "company_package_subscriptions",
    "company_listings",
    "company_media",
    "proof_reviews",
    "analytics_events",
    "whatsapp_messages",
    "admin_passwords",
    "admin_audit_logs",
  ];

  const tableChecks = await Promise.all(
    requiredTables.map(async (table) => ({
      table,
      ready: await hasReadableTable(table),
    })),
  );
  const columnChecks = await Promise.all([
    {
      column: "requirement_matches.company_listing_id",
      ready: await hasCompanyStaffRequirementMatchColumn(),
    },
    {
      column: "professionals.age",
      ready: await hasReadableColumn("professionals", "age"),
    },
    {
      column: "professionals.tagline",
      ready: await hasReadableColumn("professionals", "tagline"),
    },
    {
      column: "professionals.profile_photo_url",
      ready: await hasReadableColumn("professionals", "profile_photo_url"),
    },
    {
      column: "professionals.phone_normalized",
      ready: await hasReadableColumn("professionals", "phone_normalized"),
    },
    {
      column: "company_listings.service_group",
      ready: await hasReadableColumn("company_listings", "service_group"),
    },
    {
      column: "company_listings.age",
      ready: await hasReadableColumn("company_listings", "age"),
    },
    {
      column: "company_listings.profile_photo_url",
      ready: await hasReadableColumn("company_listings", "profile_photo_url"),
    },
    {
      column: "companies.logo_url",
      ready: await hasReadableColumn("companies", "logo_url"),
    },
  ]);

  return {
    ready:
      tableChecks.every((check) => check.ready) &&
      columnChecks.every((check) => check.ready),
    missingTables: tableChecks
      .filter((check) => !check.ready)
      .map((check) => check.table),
    missingColumns: columnChecks
      .filter((check) => !check.ready)
      .map((check) => check.column),
  };
}

type RequiredBucket = {
  name: string;
  minFileSizeLimit: number;
};

async function checkStorageBucket(bucket: RequiredBucket) {
  if (!supabase) {
    return { bucket: bucket.name, ready: false, issue: null };
  }

  const { data, error } = await supabase.storage.getBucket(bucket.name);

  if (error) {
    console.error(`Admin system health bucket check failed for ${bucket.name}`, error);
    return { bucket: bucket.name, ready: false, issue: null };
  }

  const fileSizeLimit =
    typeof data?.file_size_limit === "number" ? data.file_size_limit : null;

  if (fileSizeLimit !== null && fileSizeLimit < bucket.minFileSizeLimit) {
    return {
      bucket: bucket.name,
      ready: false,
      issue: `${bucket.name} limit is ${(fileSizeLimit / 1024 / 1024).toFixed(1)}MB; expected at least ${(bucket.minFileSizeLimit / 1024 / 1024).toFixed(0)}MB`,
    };
  }

  return { bucket: bucket.name, ready: true, issue: null };
}

async function getStorageBucketReadiness() {
  const requiredBuckets: RequiredBucket[] = [
    { name: "proof-images", minFileSizeLimit: 8 * 1024 * 1024 },
  ];
  const bucketChecks = await Promise.all(requiredBuckets.map(checkStorageBucket));

  return {
    ready: bucketChecks.every((check) => check.ready),
    missingBuckets: bucketChecks
      .filter((check) => !check.ready && !check.issue)
      .map((check) => check.bucket),
    bucketIssues: bucketChecks
      .map((check) => check.issue)
      .filter((issue): issue is string => Boolean(issue)),
  };
}
