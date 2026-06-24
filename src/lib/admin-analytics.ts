import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const PK_OFFSET_MS = 5 * 60 * 60 * 1000;

export type AnalyticsRange =
  | "2h"
  | "24h"
  | "today"
  | "yesterday"
  | "7"
  | "30"
  | "custom"
  | "all";

export type AnalyticsFilters = {
  range: AnalyticsRange;
  category: string;
  city: string;
  source: string;
  includeSampleData: boolean;
  start: string;
  end: string;
  startIso: string | null;
  endIso: string | null;
  label: string;
};

type SupabaseRelation = { name?: string | null } | Array<{ name?: string | null }> | null;

type WorkerRow = {
  id: string;
  full_name: string | null;
  created_at: string;
  is_active: boolean | null;
  categories: SupabaseRelation;
  cities: SupabaseRelation;
};

type CompanyStaffRow = {
  id: string;
  title: string | null;
  category: string | null;
  city: string | null;
  status: string | null;
  created_at: string;
};

type RequirementRow = {
  id: string;
  required_service: string | null;
  status: string | null;
  created_at: string;
  cities: SupabaseRelation;
};

type EventRow = {
  event_type: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type BreakdownRow = {
  label: string;
  value: number;
  percent: number;
};

export type RegisteredSubcategoryRow = BreakdownRow & {
  workerRegistrations: number;
  companyStaffProfiles: number;
};

export type TimelineRow = {
  date: string;
  workers: number;
  staff: number;
  requirements: number;
  contacts: number;
};

export type AnalyticsReport = {
  filters: AnalyticsFilters;
  supabaseConfigured: boolean;
  categoryOptions: string[];
  cityOptions: string[];
  stats: {
    workerRegistrations: number;
    approvedWorkers: number;
    companyStaffProfiles: number;
    approvedCompanyStaff: number;
    requirementsSubmitted: number;
    profileViews: number;
    pageViews: number;
    uniqueVisitors: number;
    trackedSearches: number;
    callClicks: number;
    whatsappClicks: number;
    contactClicks: number;
    totalRegistrations: number;
    registerClicks: number;
    registrationFormStarts: number;
    registrationSubmitAttempts: number;
    registrationFailures: number;
    registrationSuccesses: number;
    abandonedRegistrations: number;
    selectedCategoryRegistrations: number;
    selectedCategoryRequirements: number;
    selectedCategoryContactClicks: number;
  };
  funnel: BreakdownRow[];
  registrationFunnel: BreakdownRow[];
  registrationRoleBreakdown: BreakdownRow[];
  registrationFailureBreakdown: BreakdownRow[];
  registrationSourceBreakdown: BreakdownRow[];
  registrationFieldBreakdown: BreakdownRow[];
  registeredSubcategoryBreakdown: RegisteredSubcategoryRow[];
  categoryBreakdown: BreakdownRow[];
  cityBreakdown: BreakdownRow[];
  sourceBreakdown: BreakdownRow[];
  searchTermBreakdown: BreakdownRow[];
  pageBreakdown: BreakdownRow[];
  timeline: TimelineRow[];
  recentSignals: Array<{
    type: string;
    label: string;
    detail: string;
    createdAt: string;
  }>;
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function matchesFilter(value: string | null | undefined, filter: string) {
  const normalizedFilter = normalize(filter);
  if (!normalizedFilter || normalizedFilter === "all") {
    return true;
  }

  const normalizedValue = normalize(value);
  return (
    normalizedValue === normalizedFilter ||
    normalizedValue.includes(normalizedFilter) ||
    normalizedFilter.includes(normalizedValue)
  );
}

function isSampleDataName(value: string | null | undefined) {
  return normalize(value).startsWith("sample data");
}

function relationName(value: SupabaseRelation) {
  if (Array.isArray(value)) {
    return value[0]?.name ?? "Unknown";
  }

  return value?.name ?? "Unknown";
}

function startOfPakistanDay(date: Date) {
  const pkDate = new Date(date.getTime() + PK_OFFSET_MS);
  return new Date(
    Date.UTC(
      pkDate.getUTCFullYear(),
      pkDate.getUTCMonth(),
      pkDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ) - PK_OFFSET_MS,
  );
}

function pkDateLabel(dateValue: string) {
  const date = new Date(new Date(dateValue).getTime() + PK_OFFSET_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateInputValue(date: Date) {
  return pkDateLabel(date.toISOString());
}

function parseDateInput(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) - PK_OFFSET_MS);
}

function paramsGet(
  params: URLSearchParams | Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  if (!params) {
    return "";
  }

  if (params instanceof URLSearchParams) {
    return params.get(key) ?? "";
  }

  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseAnalyticsFilters(
  params?: URLSearchParams | Record<string, string | string[] | undefined>,
): AnalyticsFilters {
  const rawRange = paramsGet(params, "range") || paramsGet(params, "period") || "24h";
  const range: AnalyticsRange =
    rawRange === "2h" ||
    rawRange === "24h" ||
    rawRange === "today" ||
    rawRange === "yesterday" ||
    rawRange === "7" ||
    rawRange === "30" ||
    rawRange === "custom" ||
    rawRange === "all"
      ? rawRange
      : "24h";
  const now = new Date();
  const todayStart = startOfPakistanDay(now);
  let startDate: Date | null = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let endDate: Date | null = now;
  let label = "Last 24 hours";

  if (range === "2h") {
    startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    endDate = now;
    label = "Last 2 hours";
  } else if (range === "24h") {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    endDate = now;
    label = "Last 24 hours";
  } else if (range === "today") {
    startDate = todayStart;
    endDate = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    label = "Today";
  } else if (range === "7") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    endDate = now;
    label = "Last 7 days";
  } else if (range === "yesterday") {
    startDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    endDate = todayStart;
    label = "Yesterday";
  } else if (range === "30") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = now;
    label = "Last 30 days";
  } else if (range === "all") {
    startDate = null;
    endDate = null;
    label = "All time";
  } else if (range === "custom") {
    const parsedStart = parseDateInput(paramsGet(params, "start"));
    const parsedEnd = parseDateInput(paramsGet(params, "end"));
    startDate = parsedStart ?? todayStart;
    endDate = parsedEnd
      ? new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    label = `${dateInputValue(startDate)} to ${dateInputValue(
      new Date(endDate.getTime() - 1),
    )}`;
  }

  return {
    range,
    category: paramsGet(params, "category").trim(),
    city: paramsGet(params, "city").trim(),
    source: paramsGet(params, "source").trim() || "all",
    includeSampleData: paramsGet(params, "includeSampleData") === "1",
    start: startDate ? dateInputValue(startDate) : "",
    end: endDate ? dateInputValue(new Date(endDate.getTime() - 1)) : "",
    startIso: startDate?.toISOString() ?? null,
    endIso: endDate?.toISOString() ?? null,
    label,
  };
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = item || "Unknown";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

function breakdown(counts: Record<string, number>, limit = 10): BreakdownRow[] {
  const max = Math.max(...Object.values(counts), 1);
  return Object.entries(counts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, limit)
    .map(([label, value]) => ({
      label,
      value,
      percent: Math.round((value / max) * 100),
    }));
}

function addCount(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function addRegisteredSubcategory(
  map: Map<string, { workerRegistrations: number; companyStaffProfiles: number }>,
  key: string,
  type: "worker" | "staff",
) {
  const label = key || "Unknown";
  const current = map.get(label) ?? { workerRegistrations: 0, companyStaffProfiles: 0 };

  if (type === "worker") {
    current.workerRegistrations += 1;
  } else {
    current.companyStaffProfiles += 1;
  }

  map.set(label, current);
}

function applyDateWindow<T extends { created_at: string }>(items: T[], filters: AnalyticsFilters) {
  return items.filter((item) => {
    const createdAt = new Date(item.created_at).getTime();
    const start = filters.startIso ? new Date(filters.startIso).getTime() : null;
    const end = filters.endIso ? new Date(filters.endIso).getTime() : null;
    return (!start || createdAt >= start) && (!end || createdAt < end);
  });
}

function eventSource(event: EventRow) {
  const source = String(event.metadata?.source ?? "").trim();

  if (source && source !== "unknown") {
    return source;
  }

  const path = String(event.metadata?.path ?? "").trim();
  const href = String(event.metadata?.href ?? "").trim();

  if (path.startsWith("/register/")) {
    return "direct-or-qr";
  }

  if (href.startsWith("/register")) {
    return "site-navigation";
  }

  return "unknown";
}

function eventCategory(event: EventRow) {
  return String(event.metadata?.category ?? event.metadata?.profession ?? "Unknown");
}

function eventCity(event: EventRow) {
  return String(event.metadata?.city ?? "Unknown");
}

function eventSearchTerm(event: EventRow) {
  const term = String(event.metadata?.search_term ?? event.metadata?.query ?? "").trim();

  if (term) {
    return term;
  }

  const category = String(event.metadata?.category ?? "").trim();
  const city = String(event.metadata?.city ?? "").trim();

  if (category && city) {
    return `${category} in ${city}`;
  }

  return category || city || "Filtered search";
}

function eventPath(event: EventRow) {
  return String(event.metadata?.path ?? "Unknown");
}

function eventRole(event: EventRow) {
  return String(event.metadata?.role ?? "unknown");
}

function eventFailureReason(event: EventRow) {
  const failureReason = String(event.metadata?.failure_reason ?? "unknown");

  if (
    failureReason === "validation" &&
    eventErrorCodes(event).includes("phoneInvalid")
  ) {
    return "invalid_phone";
  }

  return failureReason;
}

function eventErrorCodes(event: EventRow) {
  return String(event.metadata?.error_codes ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isProfileViewEvent(event: EventRow) {
  const path = eventPath(event);
  return (
    event.event_type === "view" &&
    (/^\/professionals\/[^/?#]+/.test(path) ||
      /^\/company-listings\/[^/?#]+/.test(path) ||
      /^\/companies\/[^/?#]+$/.test(path))
  );
}

function isSearchPageViewEvent(event: EventRow) {
  if (event.event_type !== "view") {
    return false;
  }

  const path = eventPath(event);

  if (!path.startsWith("/professionals")) {
    return false;
  }

  const searchTerm = String(event.metadata?.search_term ?? "").trim();
  const category = String(event.metadata?.category ?? "").trim();
  const city = String(event.metadata?.city ?? "").trim();
  const query = String(event.metadata?.query ?? "").trim();

  return Boolean(searchTerm || category || city || query);
}

function eventVisitorId(event: EventRow) {
  return String(event.metadata?.visitor_id ?? "").trim();
}

function hasBrowserVisitor(event: EventRow) {
  return Boolean(eventVisitorId(event));
}

function searchEventKey(event: EventRow) {
  return [
    eventVisitorId(event),
    eventPath(event),
    String(event.metadata?.query ?? "").trim(),
    eventSearchTerm(event),
    eventCategory(event),
    eventCity(event),
  ].join("|");
}

async function dateQuery<T>(table: string, select: string, filters: AnalyticsFilters, limit = 800) {
  if (!supabase) {
    return [] as T[];
  }

  let query = supabase.from(table).select(select).order("created_at", { ascending: false }).limit(limit);

  if (filters.startIso) {
    query = query.gte("created_at", filters.startIso);
  }

  if (filters.endIso) {
    query = query.lt("created_at", filters.endIso);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Failed to load ${table} analytics`, error);
    return [] as T[];
  }

  return (data ?? []) as T[];
}

async function pagedDateQuery<T>(
  table: string,
  select: string,
  filters: AnalyticsFilters,
  maxRows = 20000,
) {
  if (!supabase) {
    return [] as T[];
  }

  const pageSize = 1000;
  const rows: T[] = [];

  for (let from = 0; from < maxRows; from += pageSize) {
    let query = supabase
      .from(table)
      .select(select)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (filters.startIso) {
      query = query.gte("created_at", filters.startIso);
    }

    if (filters.endIso) {
      query = query.lt("created_at", filters.endIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Failed to load paged ${table} analytics`, error);
      return rows;
    }

    rows.push(...((data ?? []) as T[]));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return rows;
}

export function buildAnalyticsSearchParams(filters: AnalyticsFilters) {
  const params = new URLSearchParams();
  params.set("range", filters.range);

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.city) {
    params.set("city", filters.city);
  }

  if (filters.source && filters.source !== "all") {
    params.set("source", filters.source);
  }

  if (filters.includeSampleData) {
    params.set("includeSampleData", "1");
  }

  if (filters.range === "custom") {
    if (filters.start) {
      params.set("start", filters.start);
    }

    if (filters.end) {
      params.set("end", filters.end);
    }
  }

  return params;
}

export async function loadAdminAnalyticsReport(filters: AnalyticsFilters): Promise<AnalyticsReport> {
  if (!isSupabaseConfigured || !supabase) {
    return emptyReport(filters);
  }

  const [workersRaw, staffRaw, requirementsRaw, eventsRaw, categoriesRaw, citiesRaw] =
    await Promise.all([
      dateQuery<WorkerRow>(
        "professionals",
        "id, full_name, created_at, is_active, categories(name), cities(name)",
        filters,
      ),
      dateQuery<CompanyStaffRow>(
        "company_listings",
        "id, title, category, city, status, created_at",
        filters,
      ),
      dateQuery<RequirementRow>(
        "requirements",
        "id, required_service, status, created_at, cities(name)",
        filters,
      ),
      pagedDateQuery<EventRow>(
        "analytics_events",
        "event_type, target_type, target_id, metadata, created_at",
        filters,
      ),
      supabase.from("categories").select("name").order("name", { ascending: true }),
      supabase.from("cities").select("name").order("name", { ascending: true }),
    ]);

  const workers = applyDateWindow(workersRaw, filters).filter((worker) => {
    const sourceMatches = filters.source === "all" || filters.source === "unknown";
    return (
      (filters.includeSampleData || !isSampleDataName(worker.full_name)) &&
      sourceMatches &&
      matchesFilter(relationName(worker.categories), filters.category) &&
      matchesFilter(relationName(worker.cities), filters.city)
    );
  });

  const staff = applyDateWindow(staffRaw, filters).filter((item) => {
    const sourceMatches = filters.source === "all" || filters.source === "unknown";
    return (
      (filters.includeSampleData || !isSampleDataName(item.title)) &&
      sourceMatches &&
      matchesFilter(item.category, filters.category) &&
      matchesFilter(item.city, filters.city)
    );
  });

  const requirements = applyDateWindow(requirementsRaw, filters).filter((requirement) => {
    const sourceMatches = filters.source === "all" || filters.source === "unknown";
    return (
      sourceMatches &&
      matchesFilter(requirement.required_service, filters.category) &&
      matchesFilter(relationName(requirement.cities), filters.city)
    );
  });

  const events = applyDateWindow(eventsRaw, filters).filter((event) => {
    const sourceMatches =
      filters.source === "all" || matchesFilter(eventSource(event), filters.source);
    return (
      sourceMatches &&
      matchesFilter(eventCategory(event), filters.category) &&
      matchesFilter(eventCity(event), filters.city)
    );
  });
  const browserEvents = events.filter(hasBrowserVisitor);
  const browserEventsRaw = eventsRaw.filter(hasBrowserVisitor);
  const browseSignalEvents = events.filter(
    (event) =>
      hasBrowserVisitor(event) ||
      event.event_type === "call_click" ||
      event.event_type === "whatsapp_click",
  );

  const categoryOptions = Array.from(
    new Set(
      [
        ...(((categoriesRaw.data ?? []) as Array<{ name: string | null }>).map(
          (item) => item.name ?? "",
        )),
        ...workersRaw.map((worker) => relationName(worker.categories)),
        ...staffRaw.map((item) => item.category ?? ""),
        ...requirementsRaw.map((item) => item.required_service ?? ""),
        ...browserEventsRaw.map(eventCategory),
      ].filter(Boolean),
    ),
  ).sort();

  const cityOptions = Array.from(
    new Set(
      [
        ...(((citiesRaw.data ?? []) as Array<{ name: string | null }>).map(
          (item) => item.name ?? "",
        )),
        ...workersRaw.map((worker) => relationName(worker.cities)),
        ...staffRaw.map((item) => item.city ?? ""),
        ...requirementsRaw.map((item) => relationName(item.cities)),
        ...browserEventsRaw.map(eventCity),
      ].filter(Boolean),
    ),
  ).sort();

  const byEvent = countBy(events.map((event) => event.event_type ?? "unknown"));
  const registerClickEvents = events.filter((event) => event.event_type === "register_click");
  const registrationFormStartEvents = events.filter(
    (event) => event.event_type === "registration_form_start",
  );
  const registrationSubmitAttemptEvents = events.filter(
    (event) => event.event_type === "registration_submit_attempt",
  );
  const registrationFailureEvents = events.filter(
    (event) => event.event_type === "registration_failed",
  );
  const registrationSuccessEvents = events.filter(
    (event) => event.event_type === "registration_success",
  );
  const registrationEvents = events.filter(
    (event) =>
      event.event_type === "register_click" || event.event_type?.startsWith("registration_"),
  );
  const abandonedRegistrations = Math.max(
    registrationFormStartEvents.length - registrationSubmitAttemptEvents.length,
    0,
  );
  const registrationFunnelBase = Math.max(
    registerClickEvents.length,
    registrationFormStartEvents.length,
    registrationSubmitAttemptEvents.length,
    registrationSuccessEvents.length,
    1,
  );
  const searchEvents = browserEvents.filter((event) => event.event_type === "search");
  const pageViewEvents = browserEvents.filter((event) => event.event_type === "view");
  const explicitSearchKeys = new Set(searchEvents.map(searchEventKey));
  const searchPageViewEvents = pageViewEvents.filter(
    (event) => isSearchPageViewEvent(event) && !explicitSearchKeys.has(searchEventKey(event)),
  );
  const trackedSearchEvents = [...searchEvents, ...searchPageViewEvents];
  const profileViewEvents = pageViewEvents.filter(isProfileViewEvent);
  const uniqueVisitorCount = new Set(
    events.map(eventVisitorId).filter(Boolean),
  ).size;
  const sourceSpecific = filters.source !== "all" && filters.source !== "unknown";
  const sourceWorkerRegistrations = events.filter(
    (event) => event.event_type === "worker_registration",
  ).length;
  const sourceCompanyStaffProfiles = events.filter(
    (event) => event.event_type === "company_staff_registration",
  ).length;
  const sourceRequirements = events.filter(
    (event) => event.event_type === "requirement_submission",
  ).length;
  const callClicks = byEvent.call_click ?? 0;
  const whatsappClicks = byEvent.whatsapp_click ?? 0;
  const contactClicks = callClicks + whatsappClicks;
  const selectedCategoryLabel = filters.category || "All categories";

  const categoryCounts = countBy([
    ...workers.map((worker) => relationName(worker.categories)),
    ...staff.map((item) => item.category ?? "Unknown"),
    ...requirements.map((item) => item.required_service ?? "Unknown"),
    ...browseSignalEvents.map(eventCategory),
  ]);
  const cityCounts = countBy([
    ...workers.map((worker) => relationName(worker.cities)),
    ...staff.map((item) => item.city ?? "Unknown"),
    ...requirements.map((item) => relationName(item.cities)),
    ...browseSignalEvents.map(eventCity),
  ]);
  const sourceCounts = countBy(pageViewEvents.map(eventSource));
  const searchTermCounts = countBy(trackedSearchEvents.map(eventSearchTerm));
  const pageCounts = countBy(pageViewEvents.map(eventPath));

  const timelineMap = new Map<
    string,
    { workers: number; staff: number; requirements: number; contacts: number }
  >();
  const ensureTimeline = (date: string) => {
    if (!timelineMap.has(date)) {
      timelineMap.set(date, { workers: 0, staff: 0, requirements: 0, contacts: 0 });
    }

    return timelineMap.get(date)!;
  };

  workers.forEach((worker) => {
    ensureTimeline(pkDateLabel(worker.created_at)).workers += 1;
  });
  staff.forEach((item) => {
    ensureTimeline(pkDateLabel(item.created_at)).staff += 1;
  });
  requirements.forEach((requirement) => {
    ensureTimeline(pkDateLabel(requirement.created_at)).requirements += 1;
  });
  events
    .filter(
      (event) =>
        event.event_type === "call_click" ||
        event.event_type === "whatsapp_click" ||
        (sourceSpecific &&
          (event.event_type === "worker_registration" ||
            event.event_type === "company_staff_registration" ||
            event.event_type === "requirement_submission")),
    )
    .forEach((event) => {
      const row = ensureTimeline(pkDateLabel(event.created_at));
      if (event.event_type === "worker_registration") {
        row.workers += 1;
      } else if (event.event_type === "company_staff_registration") {
        row.staff += 1;
      } else if (event.event_type === "requirement_submission") {
        row.requirements += 1;
      } else {
        row.contacts += 1;
      }
    });

  const categoryContacts = new Map<string, number>();
  events
    .filter((event) => event.event_type === "call_click" || event.event_type === "whatsapp_click")
    .forEach((event) => addCount(categoryContacts, eventCategory(event)));

  const registeredSubcategoryCounts = new Map<
    string,
    { workerRegistrations: number; companyStaffProfiles: number }
  >();

  workers.forEach((worker) => {
    addRegisteredSubcategory(
      registeredSubcategoryCounts,
      relationName(worker.categories),
      "worker",
    );
  });

  staff.forEach((item) => {
    addRegisteredSubcategory(
      registeredSubcategoryCounts,
      item.category ?? "Unknown",
      "staff",
    );
  });

  const registeredSubcategoryMax = Math.max(
    ...Array.from(registeredSubcategoryCounts.values()).map(
      (item) => item.workerRegistrations + item.companyStaffProfiles,
    ),
    1,
  );
  const registeredSubcategoryBreakdown = Array.from(registeredSubcategoryCounts.entries())
    .map(([label, value]) => {
      const total = value.workerRegistrations + value.companyStaffProfiles;

      return {
        label,
        value: total,
        workerRegistrations: value.workerRegistrations,
        companyStaffProfiles: value.companyStaffProfiles,
        percent: Math.round((total / registeredSubcategoryMax) * 100),
      };
    })
    .sort((left, right) => right.value - left.value)
    .slice(0, 12);

  const timeline = Array.from(timelineMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({ date, ...value }));

  const workerRegistrationCount = sourceSpecific ? sourceWorkerRegistrations : workers.length;
  const companyStaffProfileCount = sourceSpecific ? sourceCompanyStaffProfiles : staff.length;
  const requirementCount = sourceSpecific ? sourceRequirements : requirements.length;
  const selectedCategoryRegistrations = workerRegistrationCount + companyStaffProfileCount;

  const recentSignals = [
    ...workers.slice(0, 5).map((worker) => ({
      type: "Worker",
      label: worker.full_name ?? "Worker registration",
      detail: `${relationName(worker.categories)} / ${relationName(worker.cities)}`,
      createdAt: worker.created_at,
    })),
    ...staff.slice(0, 5).map((item) => ({
      type: "Company Staff",
      label: item.title ?? "Staff profile",
      detail: `${item.category ?? "Unknown"} / ${item.city ?? "Unknown"}`,
      createdAt: item.created_at,
    })),
    ...requirements.slice(0, 5).map((requirement) => ({
      type: "Requirement",
      label: requirement.required_service ?? "Requirement",
      detail: `${relationName(requirement.cities)} / ${requirement.status ?? "new"}`,
      createdAt: requirement.created_at,
    })),
    ...browseSignalEvents.slice(0, 5).map((event) => ({
      type: event.event_type ?? "Event",
      label: eventCategory(event),
      detail: `${eventCity(event)} / ${eventSource(event)}`,
      createdAt: event.created_at,
    })),
  ]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 10);

  return {
    filters,
    supabaseConfigured: true,
    categoryOptions,
    cityOptions,
    stats: {
      workerRegistrations: workerRegistrationCount,
      approvedWorkers: sourceSpecific
        ? sourceWorkerRegistrations
        : workers.filter((worker) => worker.is_active).length,
      companyStaffProfiles: companyStaffProfileCount,
      approvedCompanyStaff: sourceSpecific
        ? sourceCompanyStaffProfiles
        : staff.filter((item) => item.status === "approved").length,
      requirementsSubmitted: requirementCount,
      profileViews: profileViewEvents.length,
      pageViews: pageViewEvents.length,
      uniqueVisitors: uniqueVisitorCount,
      trackedSearches: trackedSearchEvents.length,
      callClicks,
      whatsappClicks,
      contactClicks,
      totalRegistrations: workerRegistrationCount + companyStaffProfileCount,
      registerClicks: registerClickEvents.length,
      registrationFormStarts: registrationFormStartEvents.length,
      registrationSubmitAttempts: registrationSubmitAttemptEvents.length,
      registrationFailures: registrationFailureEvents.length,
      registrationSuccesses: registrationSuccessEvents.length,
      abandonedRegistrations,
      selectedCategoryRegistrations,
      selectedCategoryRequirements: requirementCount,
      selectedCategoryContactClicks: filters.category
        ? categoryContacts.get(selectedCategoryLabel) ?? contactClicks
        : contactClicks,
    },
    funnel: [
      { label: "Public page views", value: pageViewEvents.length, percent: 100 },
      { label: "Search result visits", value: trackedSearchEvents.length, percent: 0 },
      { label: "Profile views", value: profileViewEvents.length, percent: 0 },
      { label: "Call / WhatsApp clicks", value: contactClicks, percent: 0 },
      { label: "Requirements submitted", value: requirementCount, percent: 0 },
      { label: "Workers registered", value: workerRegistrationCount + companyStaffProfileCount, percent: 0 },
    ].map((item, index, items) => ({
      ...item,
      percent:
        index === 0
          ? 100
          : Math.round((item.value / Math.max(items[0]?.value || item.value || 1, 1)) * 100),
    })),
    registrationFunnel: [
      { label: "Register link clicks", value: registerClickEvents.length },
      { label: "Form starts", value: registrationFormStartEvents.length },
      { label: "Form submit attempts", value: registrationSubmitAttemptEvents.length },
      { label: "Failed registrations", value: registrationFailureEvents.length },
      { label: "Abandoned after start", value: abandonedRegistrations },
      { label: "Successful registrations", value: registrationSuccessEvents.length },
    ].map((item) => ({
      ...item,
      percent: Math.round((item.value / registrationFunnelBase) * 100),
    })),
    registrationRoleBreakdown: breakdown(countBy(registrationEvents.map(eventRole)), 6),
    registrationFailureBreakdown: breakdown(
      countBy(registrationFailureEvents.map(eventFailureReason)),
      8,
    ),
    registrationSourceBreakdown: breakdown(countBy(registrationEvents.map(eventSource)), 8),
    registrationFieldBreakdown: breakdown(
      countBy(registrationFailureEvents.flatMap(eventErrorCodes)),
      10,
    ),
    registeredSubcategoryBreakdown,
    categoryBreakdown: breakdown(categoryCounts, 12),
    cityBreakdown: breakdown(cityCounts, 10),
    sourceBreakdown: breakdown(sourceCounts, 8),
    searchTermBreakdown: breakdown(searchTermCounts, 12),
    pageBreakdown: breakdown(pageCounts, 12),
    timeline,
    recentSignals,
  };
}

function emptyReport(filters: AnalyticsFilters): AnalyticsReport {
  return {
    filters,
    supabaseConfigured: false,
    categoryOptions: [],
    cityOptions: [],
    stats: {
      workerRegistrations: 0,
      approvedWorkers: 0,
      companyStaffProfiles: 0,
      approvedCompanyStaff: 0,
      requirementsSubmitted: 0,
      profileViews: 0,
      pageViews: 0,
      uniqueVisitors: 0,
      trackedSearches: 0,
      callClicks: 0,
      whatsappClicks: 0,
      contactClicks: 0,
      totalRegistrations: 0,
      registerClicks: 0,
      registrationFormStarts: 0,
      registrationSubmitAttempts: 0,
      registrationFailures: 0,
      registrationSuccesses: 0,
      abandonedRegistrations: 0,
      selectedCategoryRegistrations: 0,
      selectedCategoryRequirements: 0,
      selectedCategoryContactClicks: 0,
    },
    funnel: [],
    registrationFunnel: [],
    registrationRoleBreakdown: [],
    registrationFailureBreakdown: [],
    registrationSourceBreakdown: [],
    registrationFieldBreakdown: [],
    registeredSubcategoryBreakdown: [],
    categoryBreakdown: [],
    cityBreakdown: [],
    sourceBreakdown: [],
    searchTermBreakdown: [],
    pageBreakdown: [],
    timeline: [],
    recentSignals: [],
  };
}

export function analyticsReportToCsv(report: AnalyticsReport) {
  const rows = [
    ["Kamker Analytics Report"],
    ["Date range", report.filters.label],
    ["Category", report.filters.category || "All"],
    ["City", report.filters.city || "All"],
    ["Source", report.filters.source || "All"],
    [],
    ["Metric", "Value"],
    ["Worker registrations", report.stats.workerRegistrations],
    ["Company staff profiles", report.stats.companyStaffProfiles],
    ["Requirements submitted", report.stats.requirementsSubmitted],
    ["Page views", report.stats.pageViews],
    ["Unique browser signals", report.stats.uniqueVisitors],
    ["Tracked searches", report.stats.trackedSearches],
    ["Profile views", report.stats.profileViews],
    ["Call clicks", report.stats.callClicks],
    ["WhatsApp clicks", report.stats.whatsappClicks],
    ["Contact clicks", report.stats.contactClicks],
    ["Register link clicks", report.stats.registerClicks],
    ["Registration form starts", report.stats.registrationFormStarts],
    ["Registration form submit attempts", report.stats.registrationSubmitAttempts],
    ["Failed registrations", report.stats.registrationFailures],
    ["Successful registrations", report.stats.registrationSuccesses],
    ["Abandoned after start", report.stats.abandonedRegistrations],
    [],
    ["Registration funnel", "Count"],
    ...report.registrationFunnel.map((item) => [item.label, item.value]),
    [],
    ["Registration failures", "Count"],
    ...report.registrationFailureBreakdown.map((item) => [item.label, item.value]),
    [],
    ["Registration failed fields", "Count"],
    ...report.registrationFieldBreakdown.map((item) => [item.label, item.value]),
    [],
    ["Registration sources", "Count"],
    ...report.registrationSourceBreakdown.map((item) => [item.label, item.value]),
    [],
    ["Registered subcategories", "Total", "Workers", "Company staff"],
    ...report.registeredSubcategoryBreakdown.map((item) => [
      item.label,
      item.value,
      item.workerRegistrations,
      item.companyStaffProfiles,
    ]),
    [],
    ["Top categories", "Count"],
    ...report.categoryBreakdown.map((item) => [item.label, item.value]),
    [],
    ["Top cities", "Count"],
    ...report.cityBreakdown.map((item) => [item.label, item.value]),
    [],
    ["Top search terms", "Searches"],
    ...report.searchTermBreakdown.map((item) => [item.label, item.value]),
    [],
    ["Top pages", "Views"],
    ...report.pageBreakdown.map((item) => [item.label, item.value]),
    [],
    ["Timeline", "Workers", "Company staff", "Requirements", "Contacts"],
    ...report.timeline.map((item) => [
      item.date,
      item.workers,
      item.staff,
      item.requirements,
      item.contacts,
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\n");
}
