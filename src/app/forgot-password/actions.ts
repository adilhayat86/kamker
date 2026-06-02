"use server";

import { redirect } from "next/navigation";

import {
  clearPasswordRecoverySession,
  createPasswordRecoverySession,
  findProfessionalByPhone,
  getRecoveryProfessionalId,
  hashSecret,
  normalizePhoneNumber,
  verifySecret,
} from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function startForgotPassword(formData: FormData) {
  const phoneNumber = field(formData, "phone");

  if (!phoneNumber) {
    redirect("/forgot-password?status=missing-phone");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/forgot-password?status=not-configured");
  }

  const professional = await findProfessionalByPhone(phoneNumber);

  if (!professional?.secret_question || !professional.secret_answer_hash) {
    redirect("/forgot-password?status=not-found");
  }

  redirect(`/forgot-password?phone=${encodeURIComponent(normalizePhoneNumber(phoneNumber))}`);
}

export async function verifySecretAnswer(formData: FormData) {
  const phoneNumber = field(formData, "phone");
  const secretAnswer = field(formData, "secretAnswer");

  if (!phoneNumber || !secretAnswer) {
    redirect("/forgot-password?status=missing-answer");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/forgot-password?status=not-configured");
  }

  const professional = await findProfessionalByPhone(phoneNumber);
  const isAnswerValid = await verifySecret(
    secretAnswer.toLowerCase(),
    professional?.secret_answer_hash ?? null,
  );

  if (!professional || !isAnswerValid) {
    redirect(
      `/forgot-password?phone=${encodeURIComponent(normalizePhoneNumber(phoneNumber))}&status=wrong-answer`,
    );
  }

  await createPasswordRecoverySession(professional.id);
  redirect(`/forgot-password?phone=${encodeURIComponent(normalizePhoneNumber(phoneNumber))}&verified=1`);
}

export async function resetPasswordWithSecretAnswer(formData: FormData) {
  const phoneNumber = field(formData, "phone");
  const newPassword = field(formData, "newPassword");
  const professionalId = await getRecoveryProfessionalId();

  if (!phoneNumber || !newPassword || !professionalId) {
    redirect("/forgot-password?status=recovery-expired");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/forgot-password?status=not-configured");
  }

  const professional = await findProfessionalByPhone(phoneNumber);

  if (!professional || professional.id !== professionalId) {
    redirect("/forgot-password?status=recovery-expired");
  }

  const passwordHash = await hashSecret(newPassword);
  const { error } = await supabase
    .from("professionals")
    .update({ password_hash: passwordHash })
    .eq("id", professionalId);

  if (error) {
    console.error("Failed to reset password", error);
    redirect("/forgot-password?status=error");
  }

  await clearPasswordRecoverySession();
  redirect("/login?status=reset");
}
