"use server";

import { redirect } from "next/navigation";

import {
  getActiveCompanySubscription,
  getPublishedCompanyListingUsage,
} from "@/lib/company-packages";
import {
  getLocalCompanyRecordById,
  isLocalDemoStoreEnabled,
  saveLocalCompanyListing,
} from "@/lib/local-demo-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(formData: FormData, key: string) {
  const value = Number(field(formData, key));

  return Number.isFinite(value) && value >= 0 ? value : null;
}

function ageField(formData: FormData) {
  const value = Number(field(formData, "age"));

  return Number.isInteger(value) && value >= 16 && value <= 80 ? value : null;
}

function optionalUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function createCompanyListing(formData: FormData) {
  const companyId = field(formData, "companyId");
  const title = field(formData, "title");
  const serviceGroup = field(formData, "serviceGroup");
  const category = field(formData, "category");
  const city = field(formData, "city");
  const area = field(formData, "area");
  const tagline = field(formData, "tagline");
  const gender = field(formData, "gender");
  const age = ageField(formData);
  const availability = field(formData, "availability");
  const yearsExperience = optionalNumber(formData, "yearsExperience");
  const description = field(formData, "description");
  const hourlyRate = optionalNumber(formData, "hourlyRate");
  const monthlyRate = optionalNumber(formData, "monthlyRate");
  const profilePhotoUrl = optionalUrl(field(formData, "profilePhotoUrl"));
  const phone = field(formData, "phone");
  const whatsapp = field(formData, "whatsapp");

  if (!companyId || !title || !serviceGroup || !category || !city || age === null || !tagline || !description || tagline.length > 30) {
    redirect(`/companies/${companyId || "missing"}/listings/new?status=missing`);
  }

  if (!isSupabaseConfigured || !supabase) {
    if (isLocalDemoStoreEnabled) {
      const company = await getLocalCompanyRecordById(companyId);

      if (!company) {
        redirect(`/companies/${companyId}/listings/new?status=company-missing`);
      }

      const [activeSubscription, usage] = await Promise.all([
        getActiveCompanySubscription(companyId),
        getPublishedCompanyListingUsage(companyId),
      ]);

      if (!activeSubscription) {
        redirect(`/companies/${companyId}/listings/new?status=no-package`);
      }

      if (usage.published >= activeSubscription.listings_limit) {
        redirect(`/companies/${companyId}/listings/new?status=quota-full`);
      }

      await saveLocalCompanyListing({
        companyId,
        title,
        serviceGroup,
        category,
        city,
        area,
        tagline,
        gender,
        age,
        availability,
        yearsExperience,
        description,
        hourlyRate,
        monthlyRate,
        profilePhotoUrl,
        phone,
        whatsapp,
      });

      redirect(`/companies/${companyId}/dashboard?status=local-listing-added`);
    }

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

  const [activeSubscription, usage] = await Promise.all([
    getActiveCompanySubscription(companyId),
    getPublishedCompanyListingUsage(companyId),
  ]);

  if (!activeSubscription) {
    redirect(`/companies/${companyId}/listings/new?status=no-package`);
  }

  if (usage.published >= activeSubscription.listings_limit) {
    redirect(`/companies/${companyId}/listings/new?status=quota-full`);
  }

  const { data: listing, error } = await supabase
    .from("company_listings")
    .insert({
      company_id: companyId,
      title,
      service_group: serviceGroup,
      category,
      city,
      area: area || null,
      tagline,
      gender: gender || null,
      age,
      availability: availability || null,
      years_experience: yearsExperience,
      description,
      hourly_rate: hourlyRate,
      monthly_rate: monthlyRate,
      profile_photo_url: profilePhotoUrl || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      status: "pending",
      is_featured: false,
    })
    .select("id")
    .single();

  if (error || !listing) {
    console.error("Failed to create company listing", error);
    redirect(`/companies/${companyId}/listings/new?status=error`);
  }

  await sendAdminWhatsappAlert(
    [
      "New company listing submitted:",
      `Title: ${title}`,
      `Company ID: ${companyId}`,
      `Group: ${serviceGroup}`,
      `Category: ${category}`,
      `City: ${city}`,
      "Admin: /admin/company-listings",
    ].join("\n"),
    "company_listing",
    listing.id as string,
  );

  redirect(`/companies/${companyId}/dashboard`);
}
