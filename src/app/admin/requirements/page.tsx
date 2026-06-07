import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AdminEmptyState,
  AdminMetaGrid,
  AdminSection,
  AdminShell,
  AdminStatCard,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Requirements | Kamker Admin",
  description: "Manage customer requirements and matching results on Kamker.",
};

export const dynamic = "force-dynamic";

type Requirement = {
  id: string;
  required_service: string;
  area: string | null;
  availability: string | null;
  details: string;
  budget: string | null;
  phone_number: string;
  whatsapp_number: string | null;
  urgency: string;
  status: string;
  broadcast_status: string;
  payment_status: string;
  created_at: string;
  cities: { name: string } | null;
  matched_count?: number;
};

type RequirementsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    urgency?: string;
  }>;
};

const statusOptions = ["open", "new", "contacted", "completed", "spam"];
const urgencyOptions = ["Today", "This week", "Flexible", "Emergency"];

async function countMatches(requirements: Requirement[]) {
  const requirementIds = requirements.map((requirement) => requirement.id);

  if (!isSupabaseConfigured || !supabase || requirementIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("requirement_matches")
    .select("requirement_id")
    .in("requirement_id", requirementIds);

  if (error) {
    console.error("Failed to count requirement matches", error);
    return new Map<string, number>();
  }

  return (data ?? []).reduce((counts, row) => {
    const requirementId = String(row.requirement_id);
    counts.set(requirementId, (counts.get(requirementId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

async function getRequirements({
  q,
  status,
  urgency,
}: {
  q?: string;
  status?: string;
  urgency?: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as Requirement[];
  }

  let query = supabase
    .from("requirements")
    .select(
      "id, required_service, area, availability, details, budget, phone_number, whatsapp_number, urgency, status, broadcast_status, payment_status, created_at, cities(name)",
    )
    .order("created_at", { ascending: false })
    .limit(150);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (urgency && urgency !== "all") {
    query = query.eq("urgency", urgency);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load admin requirements", error);
    return [] as Requirement[];
  }

  const search = q?.trim().toLowerCase();
  const requirements = ((data ?? []) as unknown as Requirement[]).filter((requirement) => {
    if (!search) {
      return true;
    }

    return [
      requirement.required_service,
      requirement.cities?.name,
      requirement.area,
      requirement.availability,
      requirement.details,
      requirement.budget,
      requirement.phone_number,
      requirement.whatsapp_number,
      requirement.urgency,
      requirement.status,
      requirement.broadcast_status,
      requirement.payment_status,
    ].some((value) => value?.toLowerCase().includes(search));
  });
  const matchCounts = await countMatches(requirements);

  return requirements.map((requirement) => ({
    ...requirement,
    matched_count: matchCounts.get(requirement.id) ?? 0,
  }));
}

function fieldValue(value: string | undefined, fallback = "") {
  return value && value !== "all" ? value : fallback;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default async function AdminRequirementsPage({
  searchParams,
}: RequirementsPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login?next=/admin/requirements");
  }

  const params = await searchParams;
  const requirements = await getRequirements({
    q: params?.q,
    status: params?.status,
    urgency: params?.urgency,
  });
  const openRequirements = requirements.filter((requirement) =>
    ["open", "new"].includes(requirement.status),
  ).length;
  const matchedRequirements = requirements.filter(
    (requirement) => (requirement.matched_count ?? 0) > 0,
  ).length;
  const paidBroadcasts = requirements.filter(
    (requirement) => requirement.payment_status === "paid",
  ).length;

  return (
    <AdminShell
      active="/admin/requirements"
      title="Requirements"
      description="Manage customer demand, broadcast/payment state, and automatic worker matches."
      actions={
        <Button asChild>
          <Link href="/send-requirement">Submit Test Requirement</Link>
        </Button>
      }
    >
      {!adminPasswordConfigured ? (
        <AdminWarning title="Admin protection is not configured">
          Set owner/manager admin passwords and KAMKER_AUTH_SECRET before using production admin actions.
        </AdminWarning>
      ) : null}

      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Requirement queues need Supabase. Local fallback does not contain production customer demand.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Loaded Requirements" value={requirements.length} />
        <AdminStatCard
          label="Open Queue"
          value={openRequirements}
          tone={openRequirements ? "urgent" : "good"}
        />
        <AdminStatCard label="With Matches" value={matchedRequirements} />
        <AdminStatCard label="Paid Broadcasts" value={paidBroadcasts} />
      </div>

      <AdminSection
        title="Search & Filters"
        description="Filter requirements by service, city, contact number, status, or urgency."
      >
        <form className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <div className="grid gap-2">
            <label htmlFor="q" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={params?.q ?? ""}
              placeholder="Nurse, Lahore, phone, urgent..."
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={fieldValue(params?.status, "all")}
              className={selectClassName}
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="urgency" className="text-sm font-medium">
              Urgency
            </label>
            <select
              id="urgency"
              name="urgency"
              defaultValue={fieldValue(params?.urgency, "all")}
              className={selectClassName}
            >
              <option value="all">All urgency</option>
              {urgencyOptions.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {urgency}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="w-full lg:w-auto">
              Apply
            </Button>
            <Button asChild variant="outline" className="w-full lg:w-auto">
              <Link href="/admin/requirements">Reset</Link>
            </Button>
          </div>
        </form>
      </AdminSection>

      <AdminSection
        title="Requirement Queue"
        description="Open a requirement to inspect matched professionals and update status."
      >
        {requirements.length > 0 ? (
          <div className="grid gap-3">
            {requirements.map((requirement) => (
              <article
                key={requirement.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-primary">
                        {requirement.required_service}
                      </h2>
                      <Badge variant="outline">{requirement.status}</Badge>
                      <Badge>{requirement.matched_count ?? 0} matches</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {requirement.cities?.name ?? "Unknown city"}
                      {requirement.area ? ` - ${requirement.area}` : ""} - {requirement.urgency}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {requirement.details}
                    </p>
                  </div>
                  <Button asChild className="shrink-0">
                    <Link href={`/admin/requirements/${requirement.id}`}>
                      View Matches
                    </Link>
                  </Button>
                </div>

                <div className="mt-4">
                  <AdminMetaGrid
                    items={[
                      { label: "Phone", value: requirement.phone_number },
                      {
                        label: "WhatsApp",
                        value: requirement.whatsapp_number ?? "Not provided",
                      },
                      { label: "Availability", value: requirement.availability ?? "Any" },
                      { label: "Budget", value: requirement.budget ?? "Not provided" },
                      { label: "Broadcast", value: requirement.broadcast_status },
                      { label: "Payment", value: requirement.payment_status },
                      {
                        label: "Created",
                        value: new Date(requirement.created_at).toLocaleDateString("en-PK"),
                      },
                    ]}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <AdminEmptyState>
            No requirements match these filters. Submit a test requirement or clear filters.
          </AdminEmptyState>
        )}
      </AdminSection>
    </AdminShell>
  );
}
