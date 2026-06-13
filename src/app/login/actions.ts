"use server";

import { redirect } from "next/navigation";

import {
  createCustomerSession,
  createProfessionalSession,
  findCustomerByPhone,
  findCustomersByPhone,
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

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export async function loginProfessional(formData: FormData) {
  const phoneNumber = field(formData, "phone");
  const password = field(formData, "password");
  const next = safeNextPath(field(formData, "next"));
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
    const customerMatches = await findCustomersByPhone(phoneNumber);

    if (customerMatches.length > 1) {
      redirect("/login?status=phone-review");
    }

    const customer = customerMatches.length === 1
      ? customerMatches[0]
      : await findCustomerByPhone(phoneNumber);
    const isCustomerPasswordValid = await verifySecret(
      password,
      customer?.password_hash ?? null,
    );

    if (!customer || !isCustomerPasswordValid) {
      redirect("/login?status=invalid");
    }

    await createCustomerSession(customer.id, rememberPassword);
    redirect(next);
  }

  await createProfessionalSession(professional.id, rememberPassword);
  redirect(next === "/account" ? "/account" : next);
}
