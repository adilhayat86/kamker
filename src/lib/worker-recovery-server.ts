import "server-only";
import { supabase } from "@/lib/supabase";

// Return only setup status, never recovery answers or password hashes to pages.
export async function getWorkerRecoveryStatus(workerId: string): Promise<boolean | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("professionals")
    .select("id")
    .eq("id", workerId)
    .not("secret_question", "is", null)
    .neq("secret_question", "")
    .not("secret_answer_hash", "is", null)
    .neq("secret_answer_hash", "")
    .maybeSingle();
  return error ? null : Boolean(data);
}
