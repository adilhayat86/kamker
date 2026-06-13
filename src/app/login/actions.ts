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

function redirectToLoginStatus(status: string, next: string): never {
  const query = new URLSearchParams({ status });

  if (next && next !== "/account") {
    query.set("next", next);
  }

  redirect(`/login?${query.toString()}`);
}

export async function loginProfessional(formData: FormData) {
  const phoneNumber = field(formData, "phone");
  const password = field(formData, "password");
  const next = safeNextPath(field(formData, "next"));
  const rememberPassword = formData.get("rememberPassword") === "on";

  if (!phoneNumber || !password) {
    redirectToLoginStatus("missing", next);
  }

  if (!isSupabaseConfigured && !isLocalDemoStoreEnabled) {
    redirectToLoginStatus("not-configured", next);
  }

  const matches = await findProfessionalsByPhone(phoneNumber);

  if (matches.length > 1) {
    redirectToLoginStatus("phone-review", next);
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
      redirectToLoginStatus("phone-review", next);
    }

    const customer = customerMatches.length === 1
      ? customerMatches[0]
      : await findCustomerByPhone(phoneNumber);
    const isCustomerPasswordValid = await verifySecret(
      password,
      customer?.password_hash ?? null,
    );

    if (!customer || !isCustomerPasswordValid) {
      redirectToLoginStatus("invalid", next);
    }

    await createCustomerSession(customer.id, rememberPassword);
    redirect(next);
  }

  await createProfessionalSession(professional.id, rememberPassword);
  redirect(next === "/account" ? "/account" : next);
}
