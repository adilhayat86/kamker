import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Download,
  Filter,
  MousePointerClick,
  Search,
  Users,
} from "lucide-react";

import { AnalyticsPrintButton } from "@/components/admin/analytics-actions";
import type { AnalyticsFilters, AnalyticsReport, BreakdownRow, TimelineRow } from "@/lib/admin-analytics";
import { buildAnalyticsSearchParams } from "@/lib/admin-analytics";

type SimpleAnalyticsDashboardProps = {
  filters: AnalyticsFilters;
  report: AnalyticsReport;
};

function numberFormat(value: number) {
  return new Intl.NumberFormat("en-PK").format(value);
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
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className="rounded-lg bg-accent p-2 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-normal text-foreground">
        {numberFormat(value)}
      </p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{helper}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-normal text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function HorizontalBars({ rows, empty }: { rows: BreakdownRow[]; empty: string }) {
  if (rows.length === 0) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-semibold text-foreground">{row.label}</span>
            <span className="font-bold text-primary">{numberFormat(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
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
    return <EmptyState>No activity records match this filter yet.</EmptyState>;
  }

  return (
    <div className="grid gap-3">
      {rows.slice(-14).map((row) => {
        const total = row.workers + row.staff + row.requirements + row.contacts;

        return (
          <div key={row.date} className="grid grid-cols-[86px_1fr_48px] items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">{row.date}</span>
            <div className="h-8 overflow-hidden rounded-full bg-muted">
              <div
                className="flex h-full items-center rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground"
                style={{ width: `${Math.max((total / max) * 100, 8)}%` }}
              >
                {total > 0 ? `${total} total` : ""}
              </div>
            </div>
            <span className="text-right text-sm font-bold text-foreground">{total}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SimpleAnalyticsDashboard({ filters, report }: SimpleAnalyticsDashboardProps) {
  const currentParams = buildAnalyticsSearchParams(filters);
  const exportHref = `/admin/analytics/export?${currentParams.toString()}`;

  return (
    <div className="mt-6 space-y-6">
      <Panel
        title="Filters"
        description="Choose a date range, category, city, or traffic source to review Kamker activity."
      >
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] print:hidden">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-muted-foreground">Date range</span>
            <select
              name="range"
              defaultValue={filters.range}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <span className="font-semibold text-muted-foreground">Category / profession</span>
            <input
              name="category"
              defaultValue={filters.category}
              list="analytics-categories"
              placeholder="Nurses, Drivers, Tutors..."
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <datalist id="analytics-categories">
              {report.categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-muted-foreground">City</span>
            <input
              name="city"
              defaultValue={filters.city}
              list="analytics-cities"
              placeholder="Lahore, Karachi..."
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <datalist id="analytics-cities">
              {report.cityOptions.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-muted-foreground">Traffic source</span>
            <select
              name="source"
              defaultValue={filters.source}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All</option>
              <option value="newspaper">Newspaper/manual</option>
              <option value="facebook">Facebook</option>
              <option value="direct">Direct</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">
            <Filter className="size-4" aria-hidden="true" />
            Apply filters
          </button>
          <label className="grid gap-1 text-sm lg:col-span-2">
            <span className="font-semibold text-muted-foreground">Custom start</span>
            <input
              type="date"
              name="start"
              defaultValue={filters.start}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="grid gap-1 text-sm lg:col-span-2">
            <span className="font-semibold text-muted-foreground">Custom end</span>
            <input
              type="date"
              name="end"
              defaultValue={filters.end}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          {[
            { label: "Last 24 hours", href: presetHref(currentParams, { range: "24h", source: "all" }) },
            { label: "Today", href: presetHref(currentParams, { range: "today", source: "all" }) },
            { label: "Last 7 days", href: presetHref(currentParams, { range: "7", source: "all" }) },
            { label: "Facebook", href: presetHref(currentParams, { range: "7", source: "facebook" }) },
            { label: "Newspaper", href: presetHref(currentParams, { range: "today", source: "newspaper" }) },
          ].map((preset) => (
            <Link
              key={preset.label}
              href={preset.href}
              className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {preset.label}
            </Link>
          ))}
          <Link
            href={exportHref}
            className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </Link>
          <AnalyticsPrintButton />
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Page views" value={report.stats.pageViews} helper={`${numberFormat(report.stats.uniqueVisitors)} unique browser signals`} icon={Activity} />
        <MetricCard label="Searches" value={report.stats.trackedSearches} helper="Search terms captured from public search pages" icon={Search} />
        <MetricCard label="Worker registrations" value={report.stats.workerRegistrations} helper={`${numberFormat(report.stats.approvedWorkers)} approved workers`} icon={Users} />
        <MetricCard label="Company staff" value={report.stats.companyStaffProfiles} helper={`${numberFormat(report.stats.approvedCompanyStaff)} approved company-managed workers`} icon={Users} />
        <MetricCard label="Requirements" value={report.stats.requirementsSubmitted} helper="Customer requirements submitted in this period" icon={Search} />
        <MetricCard label="Contact clicks" value={report.stats.contactClicks} helper={`${numberFormat(report.stats.callClicks)} calls, ${numberFormat(report.stats.whatsappClicks)} WhatsApp clicks`} icon={MousePointerClick} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Conversion Funnel" description="Shows how visitors moved from browsing to search, registration, requirements, and contact clicks.">
          <div className="space-y-4">
            {report.funnel.length > 0 ? (
              report.funnel.map((step) => (
                <div key={step.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{step.label}</span>
                    <span className="font-bold text-primary">{numberFormat(step.value)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(step.percent, 4)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState>No funnel data yet. Registrations and requirements will appear after testing.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Selected Category" description="Use this after a newspaper or Facebook push for one profession.">
          <div className="grid gap-3">
            {[
              ["Registrations", report.stats.selectedCategoryRegistrations],
              ["Requirements", report.stats.selectedCategoryRequirements],
              ["Contact clicks", report.stats.selectedCategoryContactClicks],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                <span className="text-2xl font-bold text-foreground">{numberFormat(Number(value))}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title="Top Pages" description="Where visitors browsed.">
          <HorizontalBars rows={report.pageBreakdown} empty="No page views tracked yet. New public visits will appear here after deployment." />
        </Panel>
        <Panel title="Top Searches" description="What people typed.">
          <HorizontalBars rows={report.searchTermBreakdown} empty="No search terms match this filter yet." />
        </Panel>
        <Panel title="Top Categories" description="Most active services.">
          <HorizontalBars rows={report.categoryBreakdown} empty="No category data matches this filter." />
        </Panel>
        <Panel title="Top Cities" description="Most active cities.">
          <HorizontalBars rows={report.cityBreakdown} empty="No city data matches this filter." />
        </Panel>
        <Panel title="Traffic Source" description="Where visitors came from.">
          <HorizontalBars rows={report.sourceBreakdown} empty="No traffic source metadata has been captured yet." />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Panel title="Daily Activity" description="Registrations, requirements, and contact clicks by day.">
          <Timeline rows={report.timeline} />
        </Panel>
        <Panel title="Recent Activity" description="Latest records matching the selected filters." action={<ArrowUpRight className="size-5 text-muted-foreground" aria-hidden="true" />}>
          {report.recentSignals.length > 0 ? (
            <div className="space-y-3">
              {report.recentSignals.map((signal) => (
                <div key={`${signal.type}-${signal.createdAt}-${signal.label}`} className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-normal text-muted-foreground">{signal.type}</p>
                    <time className="text-xs text-muted-foreground">{new Date(signal.createdAt).toLocaleDateString("en-PK")}</time>
                  </div>
                  <p className="mt-2 truncate font-bold text-foreground">{signal.label}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{signal.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No recent records match this filter. Widen the date range or remove filters.</EmptyState>
          )}
        </Panel>
      </div>
    </div>
  );
}
