import { redirect } from "next/navigation";

import { updateAutoApprovalMode } from "@/app/admin/actions";
import {
  AdminSection,
  AdminShell,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { getAutoApproveProfessionals } from "@/lib/admin-settings";
import { getSystemHealth } from "@/lib/admin-data";

export const metadata = {
  title: "Admin Settings | Kamker",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const [autoApprove, health] = await Promise.all([
    getAutoApproveProfessionals(),
    getSystemHealth(),
  ]);

  return (
    <AdminShell
      active="/admin/settings"
      title="Settings"
      description="Operational toggles and configuration readiness. Secret values are never shown."
    >
      {!health.adminAuth ? (
        <AdminWarning title="Admin auth needs setup">
          Set KAMKER_ADMIN_PASSWORD and KAMKER_AUTH_SECRET before production admin use.
        </AdminWarning>
      ) : null}

      <AdminSection title="Auto-Approval Mode" description="Controls whether new individual worker profiles appear publicly without manual review.">
        <form action={updateAutoApprovalMode} className="max-w-md rounded-lg border bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              name="autoApprove"
              type="checkbox"
              defaultChecked={autoApprove}
              disabled={!adminAuthenticated}
              className="size-5 accent-primary"
            />
            Enable auto-approval for new workers
          </label>
          <p className="mt-2 text-sm text-muted-foreground">
            When enabled, new worker registrations appear publicly without manual admin approval.
          </p>
          <Button className="mt-4" disabled={!adminAuthenticated}>Save Mode</Button>
        </form>
      </AdminSection>

      <AdminSection title="Configuration Status" description="Safe env checks only. No secrets are printed.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Admin auth", health.adminAuth],
            ["Supabase", health.supabase],
            ["OpenAI proof review", health.openai],
            ["WhatsApp admin alerts", health.whatsapp],
          ].map(([label, ok]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-lg border bg-slate-50 p-4">
              <span className="font-medium">{label}</span>
              <span className={ok ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                {ok ? "Ready" : "Needs setup"}
              </span>
            </div>
          ))}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
