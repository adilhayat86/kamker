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
  const readyCount = Object.values(health).filter(Boolean).length;

  return (
    <AdminShell
      active="/admin/system"
      title="System Health"
      description="Deployment readiness checks for admin auth, database, AI proof review, and WhatsApp alerts."
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <AdminStatCard label="Ready Checks" value={`${readyCount}/4`} tone={readyCount === 4 ? "good" : "warning"} />
        <AdminStatCard label="Admin Auth" value={health.adminAuth ? "Ready" : "Missing"} />
        <AdminStatCard label="Supabase" value={health.supabase ? "Ready" : "Missing"} />
        <AdminStatCard label="WhatsApp Alerts" value={health.whatsapp ? "Ready" : "Missing"} />
      </div>

      <AdminSection title="Production Checklist" description="Apply before calling Kamker production-ready.">
        <div className="grid gap-3">
          {[
            ["KAMKER_ADMIN_PASSWORD and KAMKER_AUTH_SECRET are set", health.adminAuth],
            ["NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set", health.supabase],
            ["OpenAI proof review key is set if proof automation is required", health.openai],
            ["WhatsApp admin alert env vars are set", health.whatsapp],
            ["Supabase SQL migrations have been applied", health.supabase],
            ["Storage buckets professional-photos, proof-images, company-images exist", health.supabase],
          ].map(([label, ok]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
              <span className="text-sm font-medium">{label}</span>
              <span className={ok ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                {ok ? "Ready" : "Check"}
              </span>
            </div>
          ))}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
