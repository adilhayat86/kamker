import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Download,
  Filter,
  Newspaper,
  RadioTower,
  Search,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

import { AnalyticsPrintButton } from "@/components/admin/analytics-actions";
import { AdminShell, AdminWarning } from "@/components/admin/admin-ui";
import {
  buildAnalyticsSearchParams,
  loadAdminAnalyticsReport,
  parseAnalyticsFilters,
  type BreakdownRow,
  type TimelineRow,
} from "@/lib/admin-analytics";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Sci-Fi Analytics | Kamker Admin",
};

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function numberFormat(value: number) {
  return new Intl.NumberFormat("en-PK").format(value);
}

function presetHref(
  currentParams: URLSearchParams,
  updates: Record<string, string>,
) {
  const params = new URLSearchParams(currentParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  return `/admin/analytics?${params.toString()}`;
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "cyan",
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof Activity;
  tone?: "cyan" | "blue" | "purple" | "amber";
}) {
  const tones = {
    cyan: "from-cyan-400/20 to-blue-500/10 text-cyan-100 ring-cyan-300/20",
    blue: "from-blue-500/20 to-sky-400/10 text-blue-100 ring-blue-300/20",
    purple: "from-violet-500/20 to-fuchsia-400/10 text-violet-100 ring-violet-300/20",
    amber: "from-orange-400/20 to-amber-300/10 text-amber-100 ring-amber-300/20",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-br p-4 shadow-[0_0_40px_rgba(14,165,233,0.10)] ring-1 backdrop-blur",
        tones[tone],
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
          {label}
        </p>
        <span className="rounded-xl border border-white/10 bg-white/10 p-2">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-normal text-white">
        {numberFormat(value)}
      </p>
      <p className="mt-2 min-h-10 text-sm leading-5 text-white/62">{helper}</p>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  children,
  action,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cyan-200/10 bg-slate-950/70 p-4 shadow-[0_0_44px_rgba(8,145,178,0.10)] ring-1 ring-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/60">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-bold text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function HorizontalBars({ rows, empty }: { rows: BreakdownRow[]; empty: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cyan-200/20 bg-white/[0.03] p-5 text-sm text-cyan-100/62">
        {empty}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-white/84">{row.label}</span>
            <span className="font-black text-cyan-100">{numberFormat(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]"
              style={{ width: `${Math.max(row.percent, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Timeline({ rows }: { rows: TimelineRow[] }) {
  const max = Math.max(
    ...rows.map((row) => row.workers + row.staff + row.requirements + row.contacts),
    1,
  );

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-cyan-200/20 bg-white/[0.03] p-5 text-sm text-cyan-100/62">
        No timeline records match this filter yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.slice(-14).map((row) => {
        const total = row.workers + row.staff + row.requirements + row.contacts;
        return (
          <div key={row.date} className="grid grid-cols-[86px_1fr_48px] items-center gap-3">
            <span className="text-xs font-semibold text-cyan-100/70">{row.date}</span>
            <div className="h-8 overflow-hidden rounded-full border border-white/10 bg-white/5">
              <div
                className="flex h-full items-center rounded-full bg-gradient-to-r from-blue-500/90 via-cyan-300/90 to-violet-400/90 px-3 text-xs font-bold text-slate-950 shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                style={{ width: `${Math.max((total / max) * 100, 8)}%` }}
              >
                {total > 0 ? `${total} signals` : ""}
              </div>
            </div>
            <span className="text-right text-sm font-black text-white">{total}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const filters = parseAnalyticsFilters(params);
  const report = await loadAdminAnalyticsReport(filters);
  const currentParams = buildAnalyticsSearchParams(filters);
  const exportHref = `/admin/analytics/export?${currentParams.toString()}`;

  return (
    <AdminShell
      active="/admin/analytics"
      title="Analytics Command Center"
      description="Measure newspaper ads, Facebook pushes, category demand, worker registrations, requirements, and contact intent by date."
      actions={
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link
            href={exportHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Link>
        </div>
      }
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Connect Supabase to see registrations, requirements, profile views, and contact clicks.
        </AdminWarning>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-[0_0_60px_rgba(2,132,199,0.18)] print:border-slate-200 print:bg-white print:text-slate-950 print:shadow-none">
        <div className="relative">
          <div
            className="absolute inset-0 opacity-30 print:hidden"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.14) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.34),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.20),transparent_30%)] print:hidden" />
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
                  <RadioTower className="size-3.5" aria-hidden="true" />
                  Live marketplace telemetry
                </div>
                <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-normal sm:text-4xl">
                  Ad-result scanner for Kamker growth.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-cyan-50/68">
                  Example: choose <span className="font-bold text-cyan-100">Actors</span>, set
                  date to today, and see actor registrations, demand, and contact intent from
                  that campaign window.
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-300/20 bg-black/30 p-4 shadow-[0_0_32px_rgba(34,211,238,0.14)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/60">
                  Current scan
                </p>
                <p className="mt-2 text-xl font-black text-white">{report.filters.label}</p>
                <p className="mt-1 text-sm text-cyan-100/62">
                  {report.filters.category || "All categories"} /{" "}
                  {report.filters.city || "All cities"} / {report.filters.source || "all"}
                </p>
                {!report.filters.includeSampleData ? (
                  <p className="mt-2 text-xs font-semibold text-cyan-100/50">
                    Sample Data records hidden from worker and staff counts.
                  </p>
                ) : null}
                <p className="mt-2 text-xs font-semibold text-cyan-100/50">
                  Page views are public page loads. Profile views count only worker, staff, and
                  company profile pages.
                </p>
                {report.filters.range === "today" ? (
                  <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-50/80">
                    Today starts at midnight Pakistan time. For late-night testing or recent
                    friend/nephew visits, use Last 24 hours.
                  </p>
                ) : null}
              </div>
            </div>

            <form className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-4 print:hidden">
              <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_.9fr_auto]">
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-cyan-100/78">Date range</span>
                  <select
                    name="range"
                    defaultValue={filters.range}
                    className="h-11 rounded-xl border border-cyan-200/20 bg-slate-950 px-3 text-white outline-none ring-cyan-300/0 transition focus:ring-2"
                  >
                    <option value="24h">Last 24 hours</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="custom">Custom</option>
                    <option value="all">All time</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-cyan-100/78">Category / profession</span>
                  <input
                    name="category"
                    defaultValue={filters.category}
                    list="analytics-categories"
                    placeholder="Actors, Nurses, Drivers..."
                    className="h-11 rounded-xl border border-cyan-200/20 bg-slate-950 px-3 text-white outline-none ring-cyan-300/0 transition placeholder:text-white/32 focus:ring-2"
                  />
                  <datalist id="analytics-categories">
                    {report.categoryOptions.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-cyan-100/78">City</span>
                  <input
                    name="city"
                    defaultValue={filters.city}
                    list="analytics-cities"
                    placeholder="Lahore, Karachi..."
                    className="h-11 rounded-xl border border-cyan-200/20 bg-slate-950 px-3 text-white outline-none ring-cyan-300/0 transition placeholder:text-white/32 focus:ring-2"
                  />
                  <datalist id="analytics-cities">
                    {report.cityOptions.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-cyan-100/78">Source</span>
                  <select
                    name="source"
                    defaultValue={filters.source}
                    className="h-11 rounded-xl border border-cyan-200/20 bg-slate-950 px-3 text-white outline-none ring-cyan-300/0 transition focus:ring-2"
                  >
                    <option value="all">All</option>
                    <option value="newspaper">Newspaper/manual</option>
                    <option value="facebook">Facebook</option>
                    <option value="direct">Direct</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 text-sm font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.38)] transition hover:bg-cyan-200">
                  <Filter className="size-4" aria-hidden="true" />
                  Scan
                </button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-cyan-100/78">Custom start</span>
                  <input
                    type="date"
                    name="start"
                    defaultValue={filters.start}
                    className="h-11 rounded-xl border border-cyan-200/20 bg-slate-950 px-3 text-white outline-none ring-cyan-300/0 transition focus:ring-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-cyan-100/78">Custom end</span>
                  <input
                    type="date"
                    name="end"
                    defaultValue={filters.end}
                    className="h-11 rounded-xl border border-cyan-200/20 bg-slate-950 px-3 text-white outline-none ring-cyan-300/0 transition focus:ring-2"
                  />
                </label>
              </div>
              <label className="mt-3 flex items-start gap-3 rounded-xl border border-cyan-200/15 bg-white/[0.04] p-3 text-sm text-cyan-50/72">
                <input
                  type="checkbox"
                  name="includeSampleData"
                  value="1"
                  defaultChecked={filters.includeSampleData}
                  className="mt-1 size-4 rounded border-cyan-200/30 bg-slate-950"
                />
                <span>
                  Include Sample Data records in registration/staff counts. Keep this off for
                  real launch analytics.
                </span>
              </label>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              {[
                {
                  label: "Launch Pulse",
                  icon: Activity,
                  href: presetHref(currentParams, { range: "24h", source: "all" }),
                },
                {
                  label: "Today’s Ad Result",
                  icon: Newspaper,
                  href: presetHref(currentParams, { range: "today", source: "all" }),
                },
                {
                  label: "Category Push",
                  icon: Target,
                  href: presetHref(currentParams, {
                    range: filters.range || "today",
                    category: filters.category || "Actors",
                    source: "all",
                  }),
                },
                {
                  label: "Facebook Campaign Check",
                  icon: RadioTower,
                  href: presetHref(currentParams, { range: "7", source: "facebook" }),
                },
                {
                  label: "New Worker Registrations",
                  icon: Users,
                  href: presetHref(currentParams, { range: "24h", source: "all" }),
                },
              ].map((preset) => {
                const Icon = preset.icon;
                return (
                  <Link
                    key={preset.label}
                    href={preset.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold text-cyan-50/82 transition hover:bg-white/14"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {preset.label}
                  </Link>
                );
              })}
              <Link
                href={exportHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold text-cyan-50/82 transition hover:bg-white/14"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Export CSV
              </Link>
              <AnalyticsPrintButton />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <MetricCard
                label="Public page views"
                value={report.stats.pageViews}
                helper={`${numberFormat(report.stats.uniqueVisitors)} unique browser signals; ${numberFormat(
                  report.stats.profileViews,
                )} actual profile views`}
                icon={Activity}
                tone="blue"
              />
              <MetricCard
                label="Search result visits"
                value={report.stats.trackedSearches}
                helper="Visits to filtered worker search pages and explicit search actions"
                icon={Search}
                tone="cyan"
              />
              <MetricCard
                label="Worker registrations"
                value={report.stats.workerRegistrations}
                helper={`${numberFormat(report.stats.approvedWorkers)} approved in this scan`}
                icon={Users}
                tone="cyan"
              />
              <MetricCard
                label="Company staff"
                value={report.stats.companyStaffProfiles}
                helper={`${numberFormat(report.stats.approvedCompanyStaff)} approved company-managed workers`}
                icon={Sparkles}
                tone="blue"
              />
              <MetricCard
                label="Requirements"
                value={report.stats.requirementsSubmitted}
                helper="Customer demand submitted during this window"
                icon={Search}
                tone="purple"
              />
              <MetricCard
                label="Contact clicks"
                value={report.stats.contactClicks}
                helper={`${numberFormat(report.stats.callClicks)} calls, ${numberFormat(
                  report.stats.whatsappClicks,
                )} WhatsApp clicks`}
                icon={Zap}
                tone="amber"
              />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
              <Panel title="Conversion Funnel" eyebrow="From attention to action">
                <div className="space-y-4">
                  {report.funnel.length > 0 ? (
                    report.funnel.map((step) => (
                      <div key={step.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-semibold text-white/84">{step.label}</span>
                          <span className="font-black text-cyan-100">
                            {numberFormat(step.value)}
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500"
                            style={{ width: `${Math.max(step.percent, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-cyan-200/20 bg-white/[0.03] p-5 text-sm text-cyan-100/62">
                      No funnel data yet. Registrations and requirements will appear after testing.
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Selected Category Result" eyebrow="Ad campaign answer">
                <div className="grid gap-3">
                  {[
                    ["Registrations", report.stats.selectedCategoryRegistrations],
                    ["Requirements", report.stats.selectedCategoryRequirements],
                    ["Contact clicks", report.stats.selectedCategoryContactClicks],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <span className="text-sm font-semibold text-cyan-100/72">{label}</span>
                      <span className="text-2xl font-black text-white">
                        {numberFormat(Number(value))}
                      </span>
                    </div>
                  ))}
                  <p className="rounded-xl border border-cyan-300/15 bg-cyan-300/8 p-3 text-sm leading-6 text-cyan-50/70">
                    Use this panel after a newspaper or Facebook category push. Set category to
                    the advertised profession and date to the ad day.
                  </p>
                </div>
              </Panel>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-5">
              <Panel title="Top Pages" eyebrow="Where visitors browsed">
                <HorizontalBars
                  rows={report.pageBreakdown}
                  empty="No page views tracked yet. New public visits will appear here after this deploy."
                />
              </Panel>
              <Panel title="Search Terms" eyebrow="What people typed">
                <HorizontalBars
                  rows={report.searchTermBreakdown}
                  empty="No search terms match this filter yet. Public searches will appear here after visitors search Kamker."
                />
              </Panel>
              <Panel title="Category Leaderboard" eyebrow="Where supply and demand moved">
                <HorizontalBars
                  rows={report.categoryBreakdown}
                  empty="No category data matches this filter."
                />
              </Panel>
              <Panel title="City Heat List" eyebrow="Pakistan market spread">
                <HorizontalBars rows={report.cityBreakdown} empty="No city data matches this filter." />
              </Panel>
              <Panel title="Source Signal" eyebrow="Traffic origin">
                <HorizontalBars
                  rows={report.sourceBreakdown}
                  empty="No source metadata has been captured yet."
                />
              </Panel>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
              <Panel title="Daily Signal Timeline" eyebrow="Registration, demand, contact">
                <Timeline rows={report.timeline} />
              </Panel>
              <Panel
                title="Recent Signals"
                eyebrow="Latest matching records"
                action={<ArrowUpRight className="size-5 text-cyan-100/58" aria-hidden="true" />}
              >
                {report.recentSignals.length > 0 ? (
                  <div className="space-y-3">
                    {report.recentSignals.map((signal) => (
                      <div
                        key={`${signal.type}-${signal.createdAt}-${signal.label}`}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/54">
                            {signal.type}
                          </p>
                          <time className="text-xs text-white/42">
                            {new Date(signal.createdAt).toLocaleDateString("en-PK")}
                          </time>
                        </div>
                        <p className="mt-2 truncate font-bold text-white">{signal.label}</p>
                        <p className="mt-1 truncate text-sm text-cyan-100/58">{signal.detail}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-cyan-200/20 bg-white/[0.03] p-5 text-sm text-cyan-100/62">
                    No recent records match this scan. Widen the date range or remove filters.
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
