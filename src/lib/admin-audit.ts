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

  const { error } = await supabase.from("admin_audit_logs").insert({
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    admin_label: "password-admin",
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to write admin audit log", error);
  }
}
