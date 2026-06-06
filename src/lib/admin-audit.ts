import { getAdminSessionRole } from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function recordAdminAudit(input: {
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const role = await getAdminSessionRole();
  const { error } = await supabase.from("admin_audit_logs").insert({
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    admin_label: role ? `${role}-admin` : "password-admin",
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to write admin audit log", error);
  }
}
