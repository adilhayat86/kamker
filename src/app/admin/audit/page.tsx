import { redirect } from "next/navigation";

import {
  AdminEmptyState,
  AdminMetaGrid,
  AdminSection,
  AdminShell,
  AdminWarning,
} from "@/components/admin/admin-ui";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Audit Log | Kamker Admin",
};

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  admin_label: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

async function getAuditRows() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as AuditRow[];
  }

  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("id, action, target_type, target_id, admin_label, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load admin audit logs", error);
    return [] as AuditRow[];
  }

  return (data ?? []) as AuditRow[];
}

export default async function AdminAuditPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const rows = await getAuditRows();

  return (
    <AdminShell
      active="/admin/audit"
      title="Audit Log"
      description="Best-effort record of admin actions. Missing table is reported safely in server logs."
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Audit logs require the admin_audit_logs table in Supabase.
        </AdminWarning>
      ) : null}

      <AdminSection title="Recent Admin Actions" description={`${rows.length} audit event${rows.length === 1 ? "" : "s"} loaded.`}>
        <div className="grid gap-3">
          {rows.length > 0 ? (
            rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{row.action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(row.created_at).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">{row.admin_label}</span>
                </div>
                <div className="mt-4">
                  <AdminMetaGrid
                    items={[
                      { label: "Target type", value: row.target_type },
                      { label: "Target ID", value: row.target_id ?? "Not linked" },
                      { label: "Metadata", value: JSON.stringify(row.metadata ?? {}) },
                    ]}
                  />
                </div>
              </div>
            ))
          ) : (
            <AdminEmptyState>No audit events found yet.</AdminEmptyState>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
