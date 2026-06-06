import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { logoutAdmin } from "@/app/admin/login/actions";
import {
  AdminEmptyState,
  AdminSection,
  AdminShell,
  AdminStatCard,
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

export default async function AdminPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const [summary, requirements, systemHealth] = await Promise.all([
    getAdminCountSummary(),
    getRecentRequirements(6),
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
      description="Command center for review queues, marketplace health, package activity, analytics, and system readiness."
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
          Set KAMKER_ADMIN_PASSWORD and KAMKER_AUTH_SECRET before using admin actions.
        </AdminWarning>
      ) : null}

      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Admin pages are available, but production queues and analytics need Supabase env vars and migrations.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Needs Review Now" value={reviewCount} tone={reviewCount ? "urgent" : "good"} helper="Workers, companies, staff, proofs, and requirements" />
        <AdminStatCard label="Active Marketplace Profiles" value={summary.approvedWorkers + summary.approvedCompanyStaff} helper="Approved workers plus company staff" />
        <AdminStatCard label="Active Company Packages" value={summary.activeCompanyPackages} helper="Paid package subscriptions currently active" />
        <AdminStatCard label="System Health" value={`${healthyCount}/4`} tone={healthyCount === 4 ? "good" : "warning"} helper="Admin, Supabase, OpenAI, WhatsApp" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Pending Workers" value={summary.pendingWorkers} />
        <AdminStatCard label="Pending Companies" value={summary.pendingCompanies} />
        <AdminStatCard label="Pending Company Staff" value={summary.pendingCompanyStaff} />
        <AdminStatCard label="Pending Proof Reviews" value={summary.pendingProofs} />
      </div>

      <AdminSection
        title="Needs Review Now"
        description="Start here. These are the queues that block marketplace quality, payments, and public visibility."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Workers", count: summary.pendingWorkers, href: "/admin/workers?status=pending" },
            { label: "Companies", count: summary.pendingCompanies, href: "/admin/companies?status=pending" },
            { label: "Company Staff", count: summary.pendingCompanyStaff, href: "/admin/company-listings?status=pending" },
            { label: "Proofs", count: summary.pendingProofs, href: "/admin/payments?status=pending" },
            { label: "Requirements", count: summary.newRequirements, href: "/admin#requirements" },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="rounded-xl border bg-slate-50 p-4 transition hover:border-primary hover:bg-white">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.count}</p>
              <p className="mt-2 text-xs font-medium text-primary">Open queue</p>
            </Link>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="Revenue / Package Snapshot"
        description="Package and featured placement indicators without changing pricing logic."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard label="Active Packages" value={summary.activeCompanyPackages} />
          <AdminStatCard label="Featured Workers" value={summary.activeFeaturedWorkers} />
          <AdminStatCard label="Featured Company Staff" value={summary.activeFeaturedCompanyStaff} />
        </div>
      </AdminSection>

      <AdminSection
        title="Marketplace Health"
        description="Demand and contact signals for today."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard label="New Requirements" value={summary.newRequirements} />
          <AdminStatCard label="Call Clicks Today" value={summary.todayCallClicks} />
          <AdminStatCard label="WhatsApp Clicks Today" value={summary.todayWhatsappClicks} />
        </div>
      </AdminSection>

      <AdminSection
        title="Recent Requirements"
        description="Latest customer demand and stored match counts."
        action={<Button asChild variant="outline"><Link href="/send-requirement">Submit Test Requirement</Link></Button>}
      >
        <div id="requirements" className="grid gap-3">
          {requirements.length > 0 ? (
            requirements.map((requirement) => (
              <div key={requirement.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link href={`/admin/requirements/${requirement.id}`} className="font-semibold text-primary hover:underline">
                      {requirement.required_service}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {requirement.cities?.name ?? "Unknown city"}
                      {requirement.area ? ` - ${requirement.area}` : ""} - {requirement.urgency}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{requirement.status}</Badge>
                    <Badge>{requirement.matched_count ?? 0} matches</Badge>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <AdminEmptyState>No requirements found yet.</AdminEmptyState>
          )}
        </div>
      </AdminSection>

      <AdminSection title="System Warnings" description="Safe readiness checks. No secret values are displayed.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Admin auth", systemHealth.adminAuth],
            ["Supabase", systemHealth.supabase],
            ["OpenAI proof review", systemHealth.openai],
            ["WhatsApp admin alerts", systemHealth.whatsapp],
          ].map(([label, ok]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
              <span className="font-medium">{label}</span>
              <Badge variant={ok ? "default" : "outline"}>{ok ? "Ready" : "Needs setup"}</Badge>
            </div>
          ))}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
