"use server";

import { redirect } from "next/navigation";

import {
  createCustomerSession,
  findCustomersByPhone,
  hashSecret,
} from "@/lib/auth";
import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import { normalizePakistanMobilePhone } from "@/lib/phone";
import {
  registrationFailureReasonForErrors,
  trackRegistrationFailure,
  trackRegistrationSubmitAttempt,
  trackRegistrationSuccess,
} from "@/lib/registration-analytics";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { findOrCreateCityId } from "@/lib/taxonomy";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isDuplicatePhoneDatabaseError(error: {
  code?: string;
  message?: string;
  details?: string;
} | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();

  return error?.code === "23505" && text.includes("phone_normalized");
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

  await trackRegistrationSubmitAttempt(formData, "customer", "/register/customer", {
    city: cityName,
  });

  const errors = [
    !fullName ? "fullName" : null,
    !phoneInput ? "phone" : null,
    phoneInput && !phoneValidation.ok ? "phoneInvalid" : null,
    !cityName ? "city" : null,
    password.length < 6 ? "password" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    await trackRegistrationFailure(
      formData,
      "customer",
      "/register/customer",
      registrationFailureReasonForErrors(errors),
      errors,
      { city: cityName },
    );
    await saveFormDraft("customer", {
      ...draft,
      errors: errors.join(","),
    });
    redirect(customerRegisterPath("missing", safeNext));
  }

  if (!isSupabaseConfigured || !supabase) {
    await trackRegistrationFailure(
      formData,
      "customer",
      "/register/customer",
      "not_configured",
      ["notConfigured"],
      { city: cityName },
    );
    await saveFormDraft("customer", draft);
    redirect(customerRegisterPath("not-configured", safeNext));
  }

  const existingCustomers = await findCustomersByPhone(phoneValidation.normalized);

  if (existingCustomers.length > 0) {
    await trackRegistrationFailure(
      formData,
      "customer",
      "/register/customer",
      "duplicate_phone",
      ["duplicatePhone"],
      { city: cityName },
    );
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

    if (isDuplicatePhoneDatabaseError(error)) {
      await trackRegistrationFailure(
        formData,
        "customer",
        "/register/customer",
        "duplicate_phone",
        ["duplicatePhone"],
        { city: cityName },
      );
      await saveFormDraft("customer", {
        ...draft,
        errors: "duplicatePhone",
      });
      redirect(customerRegisterPath("duplicate", safeNext));
    }

    await trackRegistrationFailure(
      formData,
      "customer",
      "/register/customer",
      "database_insert",
      [error?.code ?? "databaseInsert"],
      { city: cityName },
    );
    await saveFormDraft("customer", draft);
    redirect(customerRegisterPath("error", safeNext));
  }

  await trackRegistrationSuccess(
    formData,
    "customer",
    "/register/customer",
    customer.id as string,
    "customer",
    { city: cityName },
  );
  await createCustomerSession(customer.id as string);
  await clearFormDraft("customer");
  redirect(appendStatusToNext(safeNext, "customer-registered"));
}
