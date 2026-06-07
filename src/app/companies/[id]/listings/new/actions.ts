"use server";

import { redirect } from "next/navigation";

import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  getActiveCompanySubscription,
  getPublishedCompanyListingUsage,
} from "@/lib/company-packages";
import { uploadCompanyStaffPhoto } from "@/lib/company-media";
import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import {
  getLocalCompanyRecordById,
  isLocalDemoStoreEnabled,
  saveLocalCompanyListing,
} from "@/lib/local-demo-store";
import { phoneFieldWithCountry } from "@/lib/phone";
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

function draftKey(companyId: string) {
  return `company_listing_${companyId}`;
}

function draftPath(companyId: string) {
  return `/companies/${companyId}/listings/new`;
}

async function saveCompanyListingDraft(
  companyId: string,
  values: Record<string, string | number>,
) {
  if (!companyId) {
    return;
  }

  await saveFormDraft(draftKey(companyId), values, { path: draftPath(companyId) });
}

async function clearCompanyListingDraft(companyId: string) {
  await clearFormDraft(draftKey(companyId), { path: draftPath(companyId) });
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
  const phone = field(formData, "phone");
  const whatsapp = phoneFieldWithCountry(formData, "whatsapp");
  const source = field(formData, "source") || "unknown";
  const draft = {
    title,
    serviceGroup,
    category,
    city,
    area,
    tagline,
    gender,
    age: field(formData, "age"),
    availability,
    yearsExperience: field(formData, "yearsExperience"),
    hourlyRate: field(formData, "hourlyRate"),
    monthlyRate: field(formData, "monthlyRate"),
    phone,
    whatsapp,
    description,
  };
  const errors = [
    !title ? "title" : null,
    !serviceGroup ? "serviceGroup" : null,
    !category ? "category" : null,
    !city ? "city" : null,
    age === null ? "age" : null,
    !tagline || tagline.length > 30 ? "tagline" : null,
    !description ? "description" : null,
  ].filter((error): error is string => Boolean(error));

  if (!companyId || errors.length > 0) {
    await saveCompanyListingDraft(companyId, {
      ...draft,
      errors: errors.join(","),
    });
    redirect(`/companies/${companyId || "missing"}/listings/new?status=missing`);
  }

  if (age === null) {
    await saveCompanyListingDraft(companyId, {
      ...draft,
      errors: "age",
    });
    redirect(`/companies/${companyId}/listings/new?status=missing`);
  }

  const validAge = age;

  if (!isSupabaseConfigured || !supabase) {
    if (isLocalDemoStoreEnabled) {
      const company = await getLocalCompanyRecordById(companyId);

      if (!company) {
        await saveCompanyListingDraft(companyId, draft);
        redirect(`/companies/${companyId}/listings/new?status=company-missing`);
      }

      const [activeSubscription, usage] = await Promise.all([
        getActiveCompanySubscription(companyId),
        getPublishedCompanyListingUsage(companyId),
      ]);

      if (!activeSubscription) {
        await saveCompanyListingDraft(companyId, draft);
        redirect(`/companies/${companyId}/listings/new?status=no-package`);
      }

      if (usage.published >= activeSubscription.listings_limit) {
        await saveCompanyListingDraft(companyId, draft);
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
        age: validAge,
        availability,
        yearsExperience,
        description,
        hourlyRate,
        monthlyRate,
        profilePhotoUrl: "",
        phone,
        whatsapp,
      });

      await clearCompanyListingDraft(companyId);
      redirect(`/companies/${companyId}/dashboard?status=local-listing-added`);
    }

    await saveCompanyListingDraft(companyId, draft);
    redirect(`/companies/${companyId}/listings/new?status=not-configured`);
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) {
    await saveCompanyListingDraft(companyId, draft);
    redirect(`/companies/${companyId}/listings/new?status=company-missing`);
  }

  const [activeSubscription, usage] = await Promise.all([
    getActiveCompanySubscription(companyId),
    getPublishedCompanyListingUsage(companyId),
  ]);

  if (!activeSubscription) {
    await saveCompanyListingDraft(companyId, draft);
    redirect(`/companies/${companyId}/listings/new?status=no-package`);
  }

  if (usage.published >= activeSubscription.listings_limit) {
    await saveCompanyListingDraft(companyId, draft);
    redirect(`/companies/${companyId}/listings/new?status=quota-full`);
  }

  const browserUploadedPhotoUrl = field(formData, "profilePhotoUrl");
  let uploadedStaffPhoto: Awaited<ReturnType<typeof uploadCompanyStaffPhoto>> = null;

  if (!browserUploadedPhotoUrl) {
    try {
      uploadedStaffPhoto = await uploadCompanyStaffPhoto(formData, companyId);
    } catch (error) {
      await saveCompanyListingDraft(companyId, draft);
      redirect(
        error instanceof Error && error.message === "invalid-company-media"
          ? `/companies/${companyId}/listings/new?status=invalid-photo`
          : `/companies/${companyId}/listings/new?status=photo-error`,
      );
    }
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
      age: validAge,
      availability: availability || null,
      years_experience: yearsExperience,
      description,
      hourly_rate: hourlyRate,
      monthly_rate: monthlyRate,
      profile_photo_url: browserUploadedPhotoUrl || uploadedStaffPhoto?.publicUrl || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      status: "pending",
      is_featured: false,
    })
    .select("id")
    .single();

  if (error || !listing) {
    console.error("Failed to create company listing", error);
    await saveCompanyListingDraft(companyId, draft);
    redirect(`/companies/${companyId}/listings/new?status=error`);
  }

  await trackAnalyticsEvent({
    eventType: "company_staff_registration",
    targetType: "company_listing",
    targetId: listing.id as string,
    metadata: {
      category,
      city,
      source,
      path: `/companies/${companyId}/listings/new`,
      companyId,
    },
  });

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

  await clearCompanyListingDraft(companyId);
  redirect(`/companies/${companyId}/dashboard?status=staff-profile-submitted`);
}
