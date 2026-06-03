"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(formData: FormData, key: string) {
  const value = Number(field(formData, key));

  return Number.isFinite(value) && value >= 0 ? value : null;
}

export async function createCompanyListing(formData: FormData) {
  const companyId = field(formData, "companyId");
  const title = field(formData, "title");
  const category = field(formData, "category");
  const city = field(formData, "city");
  const area = field(formData, "area");
  const description = field(formData, "description");
  const hourlyRate = optionalNumber(formData, "hourlyRate");
  const monthlyRate = optionalNumber(formData, "monthlyRate");
  const phone = field(formData, "phone");
  const whatsapp = field(formData, "whatsapp");

  if (!companyId || !title || !category || !city || !description) {
    redirect(`/companies/${companyId || "missing"}/listings/new?status=missing`);
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect(`/companies/${companyId}/listings/new?status=not-configured`);
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) {
    redirect(`/companies/${companyId}/listings/new?status=company-missing`);
  }

  const { error } = await supabase.from("company_listings").insert({
    company_id: companyId,
    title,
    category,
    city,
    area: area || null,
    description,
    hourly_rate: hourlyRate,
    monthly_rate: monthlyRate,
    phone: phone || null,
    whatsapp: whatsapp || null,
    status: "pending",
    is_featured: false,
  });

  if (error) {
    console.error("Failed to create company listing", error);
    redirect(`/companies/${companyId}/listings/new?status=error`);
  }

  redirect(`/companies/${companyId}/dashboard`);
}
