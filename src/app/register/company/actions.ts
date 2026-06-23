"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import {
  isLocalDemoStoreEnabled,
  saveLocalCompany,
} from "@/lib/local-demo-store";
import {
  normalizePakistanMobilePhone,
  validatePhoneFieldWithCountry,
} from "@/lib/phone";
import {
  trackRegistrationFailure,
  trackRegistrationSubmitAttempt,
  trackRegistrationSuccess,
} from "@/lib/registration-analytics";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerCompany(formData: FormData) {
  const companyName = field(formData, "companyName");
  const category = field(formData, "category");
  const city = field(formData, "city");
  const area = field(formData, "area");
  const contactPerson = field(formData, "contactPerson");
  const phoneInput = field(formData, "phone");
  const phoneValidation = normalizePakistanMobilePhone(phoneInput);
  const phone = phoneValidation.normalized || phoneInput;
  const whatsappValidation = validatePhoneFieldWithCountry(formData, "whatsapp");
  const whatsapp = whatsappValidation.normalized;
  const licenseNumber = field(formData, "licenseNumber");
  const description = field(formData, "description");
  const draft = {
    companyName,
    category,
    city,
    area,
    contactPerson,
    phone: phoneInput,
    whatsapp,
    licenseNumber,
    description,
  };

  await trackRegistrationSubmitAttempt(formData, "company", "/register/company", {
    category,
    city,
  });

  const errors = [
    !companyName ? "companyName" : null,
    !category ? "category" : null,
    !city ? "city" : null,
    !contactPerson ? "contactPerson" : null,
    !phoneInput ? "phone" : null,
    phoneInput && !phoneValidation.ok ? "phoneInvalid" : null,
    !whatsappValidation.ok ? "whatsappInvalid" : null,
    !description ? "description" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    await trackRegistrationFailure(
      formData,
      "company",
      "/register/company",
      "validation",
      errors,
      { category, city },
    );
    await saveFormDraft("company", {
      ...draft,
      errors: errors.join(","),
    });
    redirect("/register/company?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    if (isLocalDemoStoreEnabled) {
      const company = await saveLocalCompany({
        companyName,
        category,
        city,
        area,
        contactPerson,
        phone,
        whatsapp,
        licenseNumber,
        description,
      });

      if (company) {
        await trackRegistrationSuccess(
          formData,
          "company",
          "/register/company",
          company.id,
          "company",
          { category, city, local_demo: true },
        );
        await clearFormDraft("company");
        redirect(`/companies/${company.id}/packages?status=local-demo`);
      }
    }

    await trackRegistrationFailure(
      formData,
      "company",
      "/register/company",
      "not_configured",
      ["notConfigured"],
      { category, city },
    );
    await saveFormDraft("company", draft);
    redirect("/register/company?status=not-configured");
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      owner_user_id: randomUUID(),
      company_name: companyName,
      category,
      city,
      area: area || null,
      contact_person: contactPerson,
      phone,
      whatsapp: whatsapp || null,
      description,
      license_number: licenseNumber || null,
      verification_status: "pending",
      payment_status: "unpaid",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to register company", error);
    await trackRegistrationFailure(
      formData,
      "company",
      "/register/company",
      "database_insert",
      [error?.code ?? "databaseInsert"],
      { category, city },
    );
    await saveFormDraft("company", draft);
    redirect("/register/company?status=error");
  }

  await trackRegistrationSuccess(
    formData,
    "company",
    "/register/company",
    data.id as string,
    "company",
    { category, city },
  );

  await sendAdminWhatsappAlert(
    [
      "New company registered on Kamker:",
      `Company: ${companyName}`,
      `Category: ${category}`,
      `City: ${city}`,
      `Phone: ${phone}`,
      "Admin: /admin/companies",
    ].join("\n"),
    "company",
    data.id as string,
  );

  await clearFormDraft("company");
  redirect(`/companies/${data.id}/packages`);
}
