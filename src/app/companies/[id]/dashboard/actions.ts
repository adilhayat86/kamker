"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  uploadCompanyGalleryMedia,
  uploadCompanyLogo,
} from "@/lib/company-media";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function updateCompanyLogo(formData: FormData) {
  const companyId = field(formData, "companyId");

  if (!companyId) {
    redirect("/register/company");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect(`/companies/${companyId}/dashboard?status=not-configured`);
  }

  let uploadedLogo: Awaited<ReturnType<typeof uploadCompanyLogo>> = null;

  try {
    uploadedLogo = await uploadCompanyLogo(formData, companyId);
  } catch (error) {
    redirect(
      error instanceof Error && error.message === "invalid-company-media"
        ? `/companies/${companyId}/dashboard?status=invalid-media`
        : `/companies/${companyId}/dashboard?status=media-error`,
    );
  }

  if (!uploadedLogo) {
    redirect(`/companies/${companyId}/dashboard?status=missing-media`);
  }

  const { error } = await supabase
    .from("companies")
    .update({ logo_url: uploadedLogo.publicUrl })
    .eq("id", companyId);

  if (error) {
    console.error("Failed to update company logo", error);
    redirect(`/companies/${companyId}/dashboard?status=media-error`);
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}/dashboard`);
  redirect(`/companies/${companyId}/dashboard?status=logo-updated`);
}

export async function addCompanyMedia(formData: FormData) {
  const companyId = field(formData, "companyId");
  const caption = field(formData, "caption");

  if (!companyId) {
    redirect("/register/company");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect(`/companies/${companyId}/dashboard?status=not-configured`);
  }

  let uploadedMedia: Awaited<ReturnType<typeof uploadCompanyGalleryMedia>> = null;

  try {
    uploadedMedia = await uploadCompanyGalleryMedia(formData, companyId);
  } catch (error) {
    redirect(
      error instanceof Error && error.message === "invalid-company-media"
        ? `/companies/${companyId}/dashboard?status=invalid-media`
        : `/companies/${companyId}/dashboard?status=media-error`,
    );
  }

  if (!uploadedMedia) {
    redirect(`/companies/${companyId}/dashboard?status=missing-media`);
  }

  const { error } = await supabase.from("company_media").insert({
    company_id: companyId,
    url: uploadedMedia.publicUrl,
    media_type: uploadedMedia.mediaType,
    caption: caption || null,
  });

  if (error) {
    console.error("Failed to add company media", error);
    redirect(`/companies/${companyId}/dashboard?status=media-error`);
  }

  revalidatePath(`/companies/${companyId}`);
  revalidatePath(`/companies/${companyId}/dashboard`);
  redirect(`/companies/${companyId}/dashboard?status=media-added`);
}
