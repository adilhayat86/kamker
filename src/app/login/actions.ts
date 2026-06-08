"use server";

import { redirect } from "next/navigation";

import {
  createProfessionalSession,
  findProfessionalByPhone,
  findProfessionalsByPhone,
  verifySecret,
} from "@/lib/auth";
import { isLocalDemoStoreEnabled } from "@/lib/local-demo-store";
import { isSupabaseConfigured } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function loginProfessional(formData: FormData) {
  const phoneNumber = field(formData, "phone");
  const password = field(formData, "password");
  const rememberPassword = formData.get("rememberPassword") === "on";

  if (!phoneNumber || !password) {
    redirect("/login?status=missing");
  }

  if (!isSupabaseConfigured && !isLocalDemoStoreEnabled) {
    redirect("/login?status=not-configured");
  }

  const matches = await findProfessionalsByPhone(phoneNumber);

  if (matches.length > 1) {
    redirect("/login?status=phone-review");
  }

  const professional = matches.length === 1
    ? matches[0]
    : await findProfessionalByPhone(phoneNumber);
  const isPasswordValid = await verifySecret(
    password,
    professional?.password_hash ?? null,
  );

  if (!professional || !isPasswordValid) {
    redirect("/login?status=invalid");
  }

  await createProfessionalSession(professional.id, rememberPassword);
  redirect("/account");
}
