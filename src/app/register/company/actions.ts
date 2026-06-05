"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
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
  const phone = field(formData, "phone");
  const whatsapp = field(formData, "whatsapp");
  const licenseNumber = field(formData, "licenseNumber");
  const description = field(formData, "description");
  const draft = {
    companyName,
    category,
    city,
    area,
    contactPerson,
    phone,
    whatsapp,
    licenseNumber,
    description,
  };

  if (!companyName || !category || !city || !contactPerson || !phone || !description) {
    await saveFormDraft("company", draft);
    redirect("/register/company?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
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
    await saveFormDraft("company", draft);
    redirect("/register/company?status=error");
  }

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
