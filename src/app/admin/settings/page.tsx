import Link from "next/link";
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

const statusMessages = {
  "auto-approval-on": "Auto-approval is ON. New workers will be approved immediately after registration.",
  "auto-approval-off": "Auto-approval is OFF. New workers will go to Unapproved Workers for admin review.",
} as const;

type AdminSettingsPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const statusMessage = params?.status ? statusMessages[params.status] : null;
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
      {statusMessage ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-900">
          {statusMessage}
        </div>
      ) : null}

      {!health.adminAuth ? (
        <AdminWarning title="Admin auth needs setup">
          Set KAMKER_OWNER_ADMIN_PASSWORD, optional KAMKER_MANAGER_ADMIN_PASSWORD,
          and KAMKER_AUTH_SECRET before production admin use.
        </AdminWarning>
      ) : null}

      <AdminSection title="Auto-Approval Mode" description="Controls whether new individual worker profiles appear publicly without manual review.">
        <form action={updateAutoApprovalMode} className="max-w-md rounded-lg border bg-slate-50 p-4">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
            <span className="font-medium">Current mode</span>
            <span className={autoApprove ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>
              {autoApprove ? "ON" : "OFF"}
            </span>
          </div>
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

      <AdminSection
        title="Admin Access"
        description="Manage owner and manager passwords. Only the owner admin can change credentials."
      >
        <div className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Owner and manager passwords</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use database-backed password overrides after Supabase is configured.
            </p>
          </div>
          <Button asChild disabled={!adminAuthenticated}>
            <Link href="/admin/change-password">Change Passwords</Link>
          </Button>
        </div>
      </AdminSection>

      <AdminSection title="Configuration Status" description="Safe env checks only. No secrets are printed.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Admin auth", health.adminAuth],
            ["Supabase", health.supabase],
            ["Database schema", health.databaseSchema],
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
