import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Filter,
  MousePointerClick,
  Search,
  Target,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { AnalyticsPrintButton } from "@/components/admin/analytics-actions";
import { AdminShell, AdminWarning } from "@/components/admin/admin-ui";
import {
  buildAnalyticsSearchParams,
  loadAdminAnalyticsReport,
  parseAnalyticsFilters,
  type AnalyticsReport,
  type BreakdownRow,
  type RegisteredSubcategoryRow,
  type TimelineRow,
} from "@/lib/admin-analytics";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Analytics Decision Dashboard | Kamker Admin",
};

export const dynamic = "force-dynamic";

type AnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function numberFormat(value: number) {
  return new Intl.NumberFormat("en-PK").format(value);
}

function percentage(part: number, whole: number) {
  if (whole <= 0) {
    return 0;
  }

  return Math.round((part / whole) * 100);
}

function presetHref(currentParams: URLSearchParams, updates: Record<string, string>) {
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
  tone = "blue",
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof Activity;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-normal text-slate-950">
            {numberFormat(value)}
          </p>
        </div>
        <span className={cn("rounded-xl border p-2", tones[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 min-h-10 text-sm leading-5 text-slate-600">{helper}</p>
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
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-black tracking-normal text-slate-950">
            {title}
          </h2>
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
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
        {empty}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-slate-700">{row.label}</span>
            <span className="font-black text-slate-950">{numberFormat(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${Math.max(row.percent, 6)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RegisteredSubcategories({
  rows,
}: {
  rows: RegisteredSubcategoryRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
        No worker or company-staff registrations matched this time range. If you ran an ad,
        widen the date range or check register clicks and failed fields.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-black text-slate-900">{row.label}</span>
              <span className="font-black text-blue-700 sm:hidden">{numberFormat(row.value)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500"
                style={{ width: `${Math.max(row.percent, 6)}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {numberFormat(row.workerRegistrations)} workers
              {row.companyStaffProfiles > 0
                ? `, ${numberFormat(row.companyStaffProfiles)} company staff`
                : ""}
            </p>
          </div>
          <span className="hidden rounded-xl bg-blue-50 px-3 py-2 text-lg font-black text-blue-700 sm:inline-flex">
            {numberFormat(row.value)}
          </span>
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
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
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
            <span className="text-xs font-semibold text-slate-500">{row.date}</span>
            <div className="h-8 overflow-hidden rounded-full bg-slate-100">
              <div
                className="flex h-full items-center rounded-full bg-blue-600 px-3 text-xs font-bold text-white"
                style={{ width: `${Math.max((total / max) * 100, 8)}%` }}
              >
                {total > 0 ? `${total} signals` : ""}
              </div>
            </div>
            <span className="text-right text-sm font-black text-slate-950">{total}</span>
          </div>
        );
      })}
    </div>
  );
}

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer px-4 py-4 text-base font-black text-slate-950">
        {title}
      </summary>
      <div className="border-t border-slate-100 p-4">{children}</div>
    </details>
  );
}

function decisionItems(report: AnalyticsReport) {
  const items: Array<{
    title: string;
    body: string;
    tone: "green" | "amber" | "red" | "blue";
  }> = [];
  const topSubcategory = report.registeredSubcategoryBreakdown[0];
  const topSearch = report.searchTermBreakdown[0];
  const topFailure = report.registrationFailureBreakdown[0];
  const registerSuccessRate = percentage(
    report.stats.registrationSuccesses,
    report.stats.registrationSubmitAttempts,
  );

  if (
    report.stats.pageViews === 0 &&
    report.stats.registerClicks === 0 &&
    report.stats.registrationFormStarts === 0
  ) {
    items.push({
      title: "No visible traffic in this range",
      body: "Use Last 24 hours or Today if you are checking newspaper or social visitors.",
      tone: "blue",
    });
  }

  if (report.stats.registrationSubmitAttempts > report.stats.registerClicks) {
    items.push({
      title: "QR or direct registration traffic is active",
      body: "Submit attempts are higher than register link clicks because some visitors opened the registration form directly from QR, bookmark, or shared link.",
      tone: "blue",
    });
  }

  if (report.stats.repeatRegisterClicks > 0) {
    items.push({
      title: "Some Register clicks are repeated taps",
      body: `${numberFormat(report.stats.repeatRegisterClicks)} of ${numberFormat(
        report.stats.registerClicks,
      )} register clicks came from visitors who already clicked once in this range. Judge demand from unique clickers, not raw clicks alone.`,
      tone: "blue",
    });
  }

  if (report.stats.registerClicks > 0 && report.stats.registrationSuccesses === 0) {
    items.push({
      title: "People clicked Register but nobody completed signup",
      body: "Check form starts, failed fields, and try the registration form on mobile. This is the highest-priority fix.",
      tone: "red",
    });
  } else if (report.stats.registrationSubmitAttempts > 0 && registerSuccessRate < 70) {
    items.push({
      title: `Registration success is ${registerSuccessRate}%`,
      body: topFailure
        ? `Most common failure: ${topFailure.label}. Fix this before spending more on ads.`
        : "Failures are higher than expected. Check failed fields and phone validation.",
      tone: "amber",
    });
  }

  if (topSubcategory) {
    items.push({
      title: `${topSubcategory.label} got new registrations`,
      body: `${numberFormat(topSubcategory.value)} new profile(s) arrived in this range. This is your clearest campaign result.`,
      tone: "green",
    });
  }

  if (topSearch && report.registeredSubcategoryBreakdown.length === 0) {
    items.push({
      title: `People searched for ${topSearch.label}`,
      body: "There were searches but no new worker registrations in this range. Add workers or run a worker-side ad for that category.",
      tone: "amber",
    });
  }

  if (items.length === 0) {
    items.push({
      title: "Traffic is low but the system is readable",
      body: "Keep watching register link clicks, form starts, failed fields, and registered subcategories after the next ad push.",
      tone: "blue",
    });
  }

  return items.slice(0, 4);
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
  const registerSuccessRate = percentage(
    report.stats.registrationSuccesses,
    report.stats.registrationSubmitAttempts,
  );

  return (
    <AdminShell
      active="/admin/analytics"
      title="Analytics Decision Dashboard"
      description="See what happened, what people searched, where registration failed, and which subcategories got new workers."
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
          Connect Supabase to see registrations, searches, profile views, and contact clicks.
        </AdminWarning>
      ) : null}

      <div className="mt-6 space-y-5">
        <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                What happened?
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                {report.filters.label}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Category: <span className="font-bold">{report.filters.category || "All"}</span>{" "}
                / City: <span className="font-bold">{report.filters.city || "All"}</span> /
                Source: <span className="font-bold">{report.filters.source || "all"}</span>
              </p>
              {!report.filters.includeSampleData ? (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Sample Data is hidden from worker and company-staff registration counts.
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm leading-6 text-slate-600">
              <p className="font-black text-slate-900">How to read this page</p>
              <p className="mt-1">
                Browser signals are not exact people. Use them for direction. Use registration
                successes and subcategories for real business decisions. QR visitors can open a
                register form directly, so submit attempts may be higher than register link clicks.
              </p>
            </div>
          </div>

          <form className="mt-5 rounded-2xl border border-blue-100 bg-white p-4 print:hidden">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_.9fr_auto]">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">Date range</span>
                <select
                  name="range"
                  defaultValue={filters.range}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="2h">Last 2 hours</option>
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
                <span className="font-semibold text-slate-700">Category / profession</span>
                <input
                  name="category"
                  defaultValue={filters.category}
                  list="analytics-categories"
                  placeholder="Drivers, Maids, Nurses..."
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <datalist id="analytics-categories">
                  {report.categoryOptions.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">City</span>
                <input
                  name="city"
                  defaultValue={filters.city}
                  list="analytics-cities"
                  placeholder="Lahore, Karachi..."
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <datalist id="analytics-cities">
                  {report.cityOptions.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">Source</span>
                <select
                  name="source"
                  defaultValue={filters.source}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All</option>
                  <option value="newspaper">Newspaper/manual</option>
                  <option value="facebook">Facebook</option>
                  <option value="direct-or-qr">Direct / QR</option>
                  <option value="direct">Direct</option>
                  <option value="site-navigation">Site navigation</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
              <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700">
                <Filter className="size-4" aria-hidden="true" />
                Apply
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">Custom start</span>
                <input
                  type="date"
                  name="start"
                  defaultValue={filters.start}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-semibold text-slate-700">Custom end</span>
                <input
                  type="date"
                  name="end"
                  defaultValue={filters.end}
                  className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
            <label className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <input
                type="checkbox"
                name="includeSampleData"
                value="1"
                defaultChecked={filters.includeSampleData}
                className="mt-1 size-4 rounded border-slate-300"
              />
              <span>Include Sample Data records. Keep this off for launch decisions.</span>
            </label>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
            {[
              ["Last 2 Hours", presetHref(currentParams, { range: "2h", source: "all" })],
              ["Last 24 Hours", presetHref(currentParams, { range: "24h", source: "all" })],
              ["Today", presetHref(currentParams, { range: "today", source: "all" })],
              ["Last 7 Days", presetHref(currentParams, { range: "7", source: "all" })],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
              >
                {label}
              </Link>
            ))}
            <Link
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Export CSV
            </Link>
            <AnalyticsPrintButton />
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Browser signals"
            value={report.stats.uniqueVisitors}
            helper={`${numberFormat(report.stats.pageViews)} public page views tracked`}
            icon={Activity}
            tone="blue"
          />
          <MetricCard
            label="Searches"
            value={report.stats.trackedSearches}
            helper="Filtered search visits and explicit search events"
            icon={Search}
            tone="blue"
          />
          <MetricCard
            label="Unique register clickers"
            value={report.stats.uniqueRegisterClickers}
            helper={`${numberFormat(report.stats.registerClicks)} raw clicks; ${numberFormat(
              report.stats.repeatRegisterClicks,
            )} repeat taps`}
            icon={MousePointerClick}
            tone="amber"
          />
          <MetricCard
            label="Form submit attempts"
            value={report.stats.registrationSubmitAttempts}
            helper={`${numberFormat(report.stats.registrationFormStarts)} form starts recorded; retries can create multiple submits`}
            icon={UserPlus}
            tone="blue"
          />
          <MetricCard
            label="Successful"
            value={report.stats.registrationSuccesses}
            helper={`${registerSuccessRate}% success from submit attempts`}
            icon={UserCheck}
            tone="green"
          />
          <MetricCard
            label="Failed"
            value={report.stats.registrationFailures}
            helper={`${numberFormat(report.stats.abandonedRegistrations)} abandoned after starting`}
            icon={AlertTriangle}
            tone={report.stats.registrationFailures > 0 ? "red" : "green"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
          <Panel title="Registered Subcategories" eyebrow="Which professions got new profiles">
            <RegisteredSubcategories rows={report.registeredSubcategoryBreakdown} />
          </Panel>

          <Panel title="What should I do next?" eyebrow="Owner decisions">
            <div className="space-y-3">
              {decisionItems(report).map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "rounded-xl border p-4",
                    item.tone === "green" && "border-emerald-100 bg-emerald-50",
                    item.tone === "amber" && "border-amber-100 bg-amber-50",
                    item.tone === "red" && "border-red-100 bg-red-50",
                    item.tone === "blue" && "border-blue-100 bg-blue-50",
                  )}
                >
                  <p className="font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel title="Registration Funnel" eyebrow="Clicks to accounts">
            <HorizontalBars
              rows={report.registrationFunnel}
              empty="No registration funnel data in this filter."
            />
          </Panel>

          <Panel title="Where Registration Failed" eyebrow="Fix these first">
            <HorizontalBars
              rows={report.registrationFieldBreakdown.length > 0
                ? report.registrationFieldBreakdown
                : report.registrationFailureBreakdown}
              empty="No failed registration submissions in this filter."
            />
          </Panel>
        </div>

        <DetailGroup title="Search, browsing, and category details">
          <div className="grid gap-4 xl:grid-cols-3">
            <Panel title="Search Terms">
              <HorizontalBars
                rows={report.searchTermBreakdown}
                empty="No search terms match this filter yet."
              />
            </Panel>
            <Panel title="Top Pages">
              <HorizontalBars rows={report.pageBreakdown} empty="No page views tracked yet." />
            </Panel>
            <Panel title="Category Activity">
              <HorizontalBars rows={report.categoryBreakdown} empty="No category data yet." />
            </Panel>
            <Panel title="Cities">
              <HorizontalBars rows={report.cityBreakdown} empty="No city data yet." />
            </Panel>
            <Panel title="Sources">
              <HorizontalBars rows={report.sourceBreakdown} empty="No source data yet." />
            </Panel>
            <Panel title="Contact Clicks">
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="font-semibold text-slate-700">Call clicks</span>
                  <span className="font-black text-slate-950">
                    {numberFormat(report.stats.callClicks)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="font-semibold text-slate-700">WhatsApp clicks</span>
                  <span className="font-black text-slate-950">
                    {numberFormat(report.stats.whatsappClicks)}
                  </span>
                </div>
              </div>
            </Panel>
          </div>
        </DetailGroup>

        <DetailGroup title="Registration details">
          <div className="grid gap-4 xl:grid-cols-3">
            <Panel title="Failure Reasons">
              <HorizontalBars
                rows={report.registrationFailureBreakdown}
                empty="No registration failures in this filter."
              />
            </Panel>
            <Panel title="Roles">
              <HorizontalBars
                rows={report.registrationRoleBreakdown}
                empty="No registration role data yet."
              />
            </Panel>
            <Panel title="Sources">
              <HorizontalBars
                rows={report.registrationSourceBreakdown}
                empty="No registration source data yet."
              />
            </Panel>
          </div>
        </DetailGroup>

        <DetailGroup title="Timeline and recent signals">
          <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
            <Panel title="Timeline">
              <Timeline rows={report.timeline} />
            </Panel>
            <Panel
              title="Recent Signals"
              action={<ArrowUpRight className="size-5 text-slate-400" aria-hidden="true" />}
            >
              {report.recentSignals.length > 0 ? (
                <div className="space-y-3">
                  {report.recentSignals.map((signal) => (
                    <div
                      key={`${signal.type}-${signal.createdAt}-${signal.label}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                          {signal.type}
                        </p>
                        <time className="text-xs text-slate-500">
                          {new Date(signal.createdAt).toLocaleString("en-PK")}
                        </time>
                      </div>
                      <p className="mt-2 truncate font-bold text-slate-950">{signal.label}</p>
                      <p className="mt-1 truncate text-sm text-slate-600">{signal.detail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No recent records match this scan.
                </div>
              )}
            </Panel>
          </div>
        </DetailGroup>

        <Panel
          title="Selected Category Campaign Result"
          eyebrow="Use after a newspaper or Facebook push"
          action={<Target className="size-5 text-blue-600" aria-hidden="true" />}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Registrations", report.stats.selectedCategoryRegistrations],
              ["Requirements", report.stats.selectedCategoryRequirements],
              ["Contact clicks", report.stats.selectedCategoryContactClicks],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-600">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {numberFormat(Number(value))}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Set the category and date range to the ad you ran. Then use Registered
            Subcategories and Registration Funnel to judge whether it worked.
          </p>
        </Panel>
      </div>
    </AdminShell>
  );
}
