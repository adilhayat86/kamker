import { redirect } from "next/navigation";

import {
  AdminSection,
  AdminShell,
  AdminStatCard,
} from "@/components/admin/admin-ui";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { getSystemHealth } from "@/lib/admin-data";

export const metadata = {
  title: "System Health | Kamker Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const health = await getSystemHealth();
  const readinessChecks = [
    ["Owner/manager admin password and KAMKER_AUTH_SECRET are set", health.adminAuth],
    ["NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set", health.supabase],
    ["Required Supabase tables and MVP columns exist", health.databaseSchema],
    ["Storage buckets professional-photos, proof-images, company-images exist", health.storageBuckets],
    ["OpenAI proof review key is set if proof automation is required", health.openai],
    ["WhatsApp admin alert env vars are set", health.whatsapp],
  ] as const;
  const readyCount = readinessChecks.filter(([, ready]) => ready).length;
  const schemaIssues = [
    ...health.missingTables.map((table) => `Missing table: ${table}`),
    ...health.missingColumns.map((column) => `Missing column: ${column}`),
    ...health.missingBuckets.map((bucket) => `Missing storage bucket: ${bucket}`),
    ...health.bucketIssues,
  ];

  return (
    <AdminShell
      active="/admin/system"
      title="System Health"
      description="Deployment readiness checks for admin auth, Supabase tables, storage, AI proof review, and WhatsApp alerts."
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        <AdminStatCard label="Ready Checks" value={`${readyCount}/6`} tone={readyCount === 6 ? "good" : "warning"} />
        <AdminStatCard label="Admin Auth" value={health.adminAuth ? "Ready" : "Missing"} />
        <AdminStatCard label="Supabase" value={health.supabase ? "Ready" : "Missing"} />
        <AdminStatCard label="Database Schema" value={health.databaseSchema ? "Ready" : "Check"} />
        <AdminStatCard label="Storage Buckets" value={health.storageBuckets ? "Ready" : "Check"} />
      </div>

      <AdminSection title="Production Checklist" description="Apply before calling Kamker production-ready.">
        <div className="grid gap-3">
          {readinessChecks.map(([label, ok]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
              <span className="text-sm font-medium">{label}</span>
              <span className={ok ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                {ok ? "Ready" : "Check"}
              </span>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="Supabase Setup Details"
        description="Use this when production forms fail. Apply schema.sql first, then every sql/*.sql migration by date order."
      >
        {schemaIssues.length > 0 ? (
          <div className="grid gap-2">
            {schemaIssues.map((issue) => (
              <div key={issue} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                {issue}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
            Required tables, latest matching column, and storage buckets are visible to the app.
          </div>
        )}

        <div className="mt-4 rounded-lg border bg-slate-50 p-4">
          <p className="text-sm font-semibold">SQL order</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>schema.sql</li>
            <li>sql/20260604_company_professional_listings.sql</li>
            <li>sql/20260604_photos_and_analytics.sql</li>
            <li>sql/20260604_proof_reviews.sql</li>
            <li>sql/20260604_whatsapp_messages.sql</li>
            <li>sql/20260604_worker_availability.sql</li>
            <li>sql/20260605_company_profiles_media.sql</li>
            <li>sql/20260606_professional_photo_limit.sql</li>
            <li>sql/20260606_worker_age.sql</li>
            <li>sql/20260607_admin_audit_logs.sql</li>
            <li>sql/20260607_admin_passwords.sql</li>
            <li>sql/20260607_company_staff_requirement_matches.sql</li>
            <li>sql/20260607_storage_upload_limits.sql</li>
            <li>sql/20260607_disable_mvp_rls.sql</li>
          </ol>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            This check covers core marketplace tables, company packages/payments,
            staff profiles, proof reviews, analytics, WhatsApp logs, admin passwords,
            audit logs, and the newer age/tagline/photo/company-media columns.
          </p>
        </div>
      </AdminSection>
    </AdminShell>
  );
}
