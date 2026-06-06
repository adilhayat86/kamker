import { redirect } from "next/navigation";

import {
  AdminEmptyState,
  AdminSection,
  AdminShell,
  AdminStatCard,
  AdminWarning,
} from "@/components/admin/admin-ui";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { getRecentAnalyticsEvents, groupCount } from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata = {
  title: "Analytics | Kamker Admin",
};

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams?: Promise<{ period?: "7" | "30" | "all" }>;
};

function topEntries(input: Record<string, number>, limit = 8) {
  return Object.entries(input)
    .sort(([, left], [, right]) => right - left)
    .slice(0, limit);
}

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const days = params?.period === "30" ? 30 : params?.period === "all" ? 3650 : 7;
  const events = await getRecentAnalyticsEvents(days, 800);
  const byEvent = groupCount(events.map((event) => event.event_type));
  const byTarget = groupCount(events.map((event) => event.target_type));
  const byCity = groupCount(events.map((event) => String(event.metadata?.city ?? "Unknown")));
  const byCategory = groupCount(events.map((event) => String(event.metadata?.category ?? "Unknown")));

  return (
    <AdminShell
      active="/admin/analytics"
      title="Analytics"
      description="Marketplace activity, contact intent, top categories, and demand signals."
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Analytics need the analytics_events table and event tracking data.
        </AdminWarning>
      ) : null}

      <AdminSection title="Period" description="Default is last 7 days.">
        <form className="flex flex-wrap gap-2">
          <button name="period" value="7" className="rounded-md border px-4 py-2 text-sm font-medium">7 days</button>
          <button name="period" value="30" className="rounded-md border px-4 py-2 text-sm font-medium">30 days</button>
          <button name="period" value="all" className="rounded-md border px-4 py-2 text-sm font-medium">All time</button>
        </form>
      </AdminSection>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <AdminStatCard label="Events" value={events.length} />
        <AdminStatCard label="Profile Views" value={byEvent.view ?? 0} />
        <AdminStatCard label="Call Clicks" value={byEvent.call_click ?? 0} />
        <AdminStatCard label="WhatsApp Clicks" value={byEvent.whatsapp_click ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[
          ["Activity by Event", byEvent],
          ["Activity by Target", byTarget],
          ["Top Cities", byCity],
          ["Top Categories", byCategory],
        ].map(([title, data]) => (
          <AdminSection key={String(title)} title={String(title)}>
            <div className="grid gap-2">
              {topEntries(data as Record<string, number>).length > 0 ? (
                topEntries(data as Record<string, number>).map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border bg-slate-50 p-3">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                ))
              ) : (
                <AdminEmptyState>No analytics events for this period.</AdminEmptyState>
              )}
            </div>
          </AdminSection>
        ))}
      </div>
    </AdminShell>
  );
}
