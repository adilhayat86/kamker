"use server";

import { redirect } from "next/navigation";

import {
  createProfessionalSession,
  findProfessionalByPhone,
  verifySecret,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function loginProfessional(formData: FormData) {
  const phoneNumber = field(formData, "phone");
  const password = field(formData, "password");

  if (!phoneNumber || !password) {
    redirect("/login?status=missing");
  }

  if (!isSupabaseConfigured) {
    redirect("/login?status=not-configured");
  }

  const professional = await findProfessionalByPhone(phoneNumber);
  const isPasswordValid = await verifySecret(
    password,
    professional?.password_hash ?? null,
  );

  if (!professional || !isPasswordValid) {
    redirect("/login?status=invalid");
  }

  await createProfessionalSession(professional.id);
  redirect("/account");
}
