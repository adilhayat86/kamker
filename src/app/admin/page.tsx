import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { logoutAdmin } from "@/app/admin/login/actions";
import {
  AdminEmptyState,
  AdminShell,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import {
  getAdminCountSummary,
  getRecentRequirements,
  getSystemHealth,
} from "@/lib/admin-data";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata = {
  title: "Admin Dashboard | Kamker",
  description: "Kamker admin operations dashboard.",
};

export const dynamic = "force-dynamic";

function CompactStatCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "urgent" | "good" | "warning";
}) {
  const toneClass =
    tone === "urgent"
      ? "text-red-600"
      : tone === "good"
        ? "text-emerald-600"
        : tone === "warning"
          ? "text-amber-600"
          : "text-foreground";

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function CompactPanel({
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
          <h2 className="font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AdminPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const [summary, requirements, systemHealth] = await Promise.all([
    getAdminCountSummary(),
    getRecentRequirements(3),
    getSystemHealth(),
  ]);

  const reviewCount =
    summary.pendingWorkers +
    summary.pendingCompanies +
    summary.pendingCompanyStaff +
    summary.pendingProofs +
    summary.newRequirements;
  const healthyCount = Object.values(systemHealth).filter(Boolean).length;

  return (
    <AdminShell
      active="/admin"
      title="Admin Dashboard"
      description="Compact command center for queues, today’s signals, and system readiness."
      actions={
        adminAuthenticated ? (
          <form action={logoutAdmin}>
            <Button variant="outline" size="sm">
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </Button>
          </form>
        ) : null
      }
    >
      {!adminPasswordConfigured ? (
        <AdminWarning title="Admin protection is not configured">
          Set KAMKER_OWNER_ADMIN_PASSWORD, optional KAMKER_MANAGER_ADMIN_PASSWORD,
          and KAMKER_AUTH_SECRET before using admin actions.
        </AdminWarning>
      ) : null}

      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Admin pages are available, but production queues and analytics need Supabase env vars and migrations.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompactStatCard
          label="Needs Review"
          value={reviewCount}
          tone={reviewCount ? "urgent" : "good"}
          helper="All open queues"
        />
        <CompactStatCard
          label="Marketplace Profiles"
          value={summary.approvedWorkers + summary.approvedCompanyStaff}
          helper="Approved public profiles"
        />
        <CompactStatCard
          label="Active Packages"
          value={summary.activeCompanyPackages}
          helper="Paid company packages"
        />
        <CompactStatCard
          label="System Health"
          value={`${healthyCount}/5`}
          tone={healthyCount === 5 ? "good" : "warning"}
          helper="Core setup checks"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <CompactPanel
          title="Review Queues"
          description="Open the queue that needs action. Detailed review stays on dedicated pages."
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Workers", count: summary.pendingWorkers, href: "/admin/workers?status=pending" },
              { label: "Companies", count: summary.pendingCompanies, href: "/admin/companies?status=pending" },
              { label: "Staff", count: summary.pendingCompanyStaff, href: "/admin/company-listings?status=pending" },
              { label: "Proofs", count: summary.pendingProofs, href: "/admin/payments?status=pending" },
              { label: "Requirements", count: summary.newRequirements, href: "/admin#requirements" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg border bg-slate-50 px-3 py-3 transition hover:border-primary hover:bg-white"
              >
                <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-bold">{item.count}</p>
                <p className="mt-1 text-xs font-medium text-primary">Open</p>
              </Link>
            ))}
          </div>
        </CompactPanel>

        <CompactPanel
          title="Today"
          description="Fast demand and contact signals."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/analytics">Analytics</Link>
            </Button>
          }
        >
          <div className="grid gap-2">
            {[
              ["Open Requirements", summary.newRequirements],
              ["Call Clicks", summary.todayCallClicks],
              ["WhatsApp Clicks", summary.todayWhatsappClicks],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className="text-lg font-bold">{value}</span>
              </div>
            ))}
          </div>
        </CompactPanel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <CompactPanel
          title="Recent Requirements"
          description="Latest 3 customer requests."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/send-requirement">Submit Test</Link>
            </Button>
          }
        >
          <div id="requirements" className="grid gap-2">
            {requirements.length > 0 ? (
              requirements.map((requirement) => (
                <Link
                  key={requirement.id}
                  href={`/admin/requirements/${requirement.id}`}
                  className="rounded-lg border bg-slate-50 px-3 py-2 transition hover:border-primary hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">
                        {requirement.required_service}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {requirement.cities?.name ?? "Unknown city"}
                        {requirement.area ? ` - ${requirement.area}` : ""} - {requirement.urgency}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Badge variant="outline">{requirement.status}</Badge>
                      <Badge>{requirement.matched_count ?? 0}</Badge>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <AdminEmptyState>No requirements found yet.</AdminEmptyState>
            )}
          </div>
        </CompactPanel>

        <CompactPanel
          title="System"
          description="Readiness checks. Secret values are never displayed."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/system">System</Link>
            </Button>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["Admin auth", systemHealth.adminAuth],
              ["Supabase", systemHealth.supabase],
              ["Database schema", systemHealth.databaseSchema],
              ["OpenAI", systemHealth.openai],
              ["WhatsApp", systemHealth.whatsapp],
            ].map(([label, ok]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium">{label}</span>
                <Badge variant={ok ? "default" : "outline"}>
                  {ok ? "Ready" : "Setup"}
                </Badge>
              </div>
            ))}
          </div>
        </CompactPanel>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-11">
          <Link href="/admin/payments">Payments & Proofs</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link href="/admin/featured">Featured Profiles</Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link href="/admin/analytics">Full Analytics</Link>
        </Button>
      </div>
    </AdminShell>
  );
}
