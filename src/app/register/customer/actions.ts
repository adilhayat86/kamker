"use server";

import { redirect } from "next/navigation";

import {
  createCustomerSession,
  findCustomersByPhone,
  hashSecret,
} from "@/lib/auth";
import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import { normalizePakistanMobilePhone } from "@/lib/phone";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { findOrCreateCityId } from "@/lib/taxonomy";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function customerRegisterPath(status: string, next: string) {
  const query = new URLSearchParams({ status });

  if (next) {
    query.set("next", next);
  }

  return `/register/customer?${query.toString()}`;
}

function appendStatusToNext(next: string, status: string) {
  if (!next) {
    return `/send-requirement?status=${status}`;
  }

  const [pathname, search = ""] = next.split("?");
  const query = new URLSearchParams(search);
  query.set("status", status);

  return `${pathname}?${query.toString()}`;
}

export async function registerCustomer(formData: FormData) {
  const fullName = field(formData, "fullName");
  const phoneInput = field(formData, "phone");
  const phoneValidation = normalizePakistanMobilePhone(phoneInput);
  const phoneNumber = phoneValidation.normalized || phoneInput;
  const cityName = field(formData, "city");
  const area = field(formData, "area");
  const password = field(formData, "password");
  const next = field(formData, "next");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const draft = {
    fullName,
    phone: phoneInput,
    city: cityName,
    area,
  };

  const errors = [
    !fullName ? "fullName" : null,
    !phoneInput ? "phone" : null,
    phoneInput && !phoneValidation.ok ? "phoneInvalid" : null,
    !cityName ? "city" : null,
    password.length < 6 ? "password" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    await saveFormDraft("customer", {
      ...draft,
      errors: errors.join(","),
    });
    redirect(customerRegisterPath("missing", safeNext));
  }

  if (!isSupabaseConfigured || !supabase) {
    await saveFormDraft("customer", draft);
    redirect(customerRegisterPath("not-configured", safeNext));
  }

  const existingCustomers = await findCustomersByPhone(phoneNumber);

  if (existingCustomers.length > 0) {
    await saveFormDraft("customer", draft);
    redirect(customerRegisterPath("duplicate", safeNext));
  }

  const [cityId, passwordHash] = await Promise.all([
    findOrCreateCityId(cityName),
    hashSecret(password),
  ]);

  const { data: customer, error } = await supabase.from("customers").insert({
    full_name: fullName,
    phone_number: phoneNumber,
    phone_normalized: phoneValidation.normalized || null,
    password_hash: passwordHash,
    city_id: cityId,
    area: area || null,
  }).select("id").single();

  if (error || !customer) {
    console.error("Failed to register customer", error);
    await saveFormDraft("customer", draft);
    redirect(customerRegisterPath("error", safeNext));
  }

  await createCustomerSession(customer.id as string);
  await clearFormDraft("customer");
  redirect(appendStatusToNext(safeNext, "customer-registered"));
}
