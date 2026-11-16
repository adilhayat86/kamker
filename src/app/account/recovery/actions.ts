"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearPasswordRecoverySession, getSessionProfessional, hashSecret, verifySecret } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { normalizeRecoveryPhrase, RECOVERY_PHRASE_QUESTION, validateRecoveryPhrase } from "@/lib/worker-recovery";

function field(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveWorkerRecovery(form: FormData) {
  const worker = await getSessionProfessional();
  if (!worker) redirect("/login?next=/account/recovery");
  if (!supabase) redirect("/account/recovery?status=save-error");

  const currentPassword = field(form, "currentPassword");
  const phrase = field(form, "recoveryPhrase");
  const error = validateRecoveryPhrase(phrase, field(form, "confirmRecoveryPhrase"), currentPassword);
  if (error) redirect(`/account/recovery?status=${error}`);
  const { data: credentials, error: credentialsError } = await supabase.from("professionals")
    .select("password_hash").eq("id", worker.id).maybeSingle();
  if (credentialsError) redirect("/account/recovery?status=save-error");
  if (!currentPassword || !(await verifySecret(currentPassword, credentials?.password_hash ?? null))) {
    redirect("/account/recovery?status=password-invalid");
  }

  const { data: saved, error: saveError } = await supabase.from("professionals").update({
    secret_question: RECOVERY_PHRASE_QUESTION,
    secret_answer_hash: await hashSecret(normalizeRecoveryPhrase(phrase)),
  }).eq("id", worker.id).select("id").single();
  if (saveError || saved?.id !== worker.id) redirect("/account/recovery?status=save-error");

  await clearPasswordRecoverySession();
  revalidatePath("/account");
  revalidatePath("/account/edit");
  revalidatePath("/account/recovery");
  redirect("/account?status=recovery-saved");
}
