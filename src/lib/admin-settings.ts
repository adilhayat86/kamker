import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const AUTO_APPROVE_KEY = "auto_approve_professionals";

export async function getAutoApproveProfessionals() {
  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", AUTO_APPROVE_KEY)
    .maybeSingle();

  if (error) {
    console.error("Failed to load auto approval setting", error);
    return true;
  }

  return data?.value !== "false";
}

export async function setAutoApproveProfessionals(enabled: boolean) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase.from("admin_settings").upsert({
    key: AUTO_APPROVE_KEY,
    value: enabled ? "true" : "false",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to update auto approval setting", error);
  }
}
