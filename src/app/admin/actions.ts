"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin-auth";
import { setAutoApproveProfessionals } from "@/lib/admin-settings";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

async function canMutateAdmin() {
  return requireAdmin();
}

export async function approveProfessional(formData: FormData) {
  const id = formData.get("professionalId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("professionals")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    console.error("Failed to approve professional", error);
  }

  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function rejectProfessional(formData: FormData) {
  const id = formData.get("professionalId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("professionals")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Failed to reject professional", error);
  }

  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function verifyCnic(formData: FormData) {
  const id = formData.get("professionalId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("professionals")
    .update({ is_cnic_verified: true })
    .eq("id", id);

  if (error) {
    console.error("Failed to verify CNIC", error);
  }

  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function makeProfessionalFeatured(formData: FormData) {
  const id = formData.get("professionalId");
  const featuredUntil = formData.get("featuredUntil");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const fallbackDate = new Date();
  fallbackDate.setDate(fallbackDate.getDate() + 30);

  const featuredUntilValue =
    typeof featuredUntil === "string" && featuredUntil
      ? new Date(`${featuredUntil}T23:59:59.000Z`).toISOString()
      : fallbackDate.toISOString();

  const { error } = await supabase
    .from("professionals")
    .update({
      is_featured: true,
      featured_until: featuredUntilValue,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to feature professional", error);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function removeProfessionalFeatured(formData: FormData) {
  const id = formData.get("professionalId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("professionals")
    .update({
      is_featured: false,
      featured_until: null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to remove featured professional", error);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function deleteProfessional(formData: FormData) {
  const id = formData.get("professionalId");
  const confirmation = formData.get("confirmDelete");

  if (
    typeof id !== "string" ||
    !id ||
    confirmation !== "DELETE" ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase.from("professionals").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete professional", error);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function approveCompanyVerification(formData: FormData) {
  const id = formData.get("companyId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("companies")
    .update({ verification_status: "verified" })
    .eq("id", id);

  if (error) {
    console.error("Failed to approve company verification", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
}

export async function rejectCompanyVerification(formData: FormData) {
  const id = formData.get("companyId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("companies")
    .update({ verification_status: "rejected" })
    .eq("id", id);

  if (error) {
    console.error("Failed to reject company verification", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
}

export async function approveCompanyListing(formData: FormData) {
  const id = formData.get("listingId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data, error } = await supabase
    .from("company_listings")
    .update({ status: "approved" })
    .eq("id", id)
    .select("company_id")
    .maybeSingle();

  if (error) {
    console.error("Failed to approve company listing", error);
  }

  revalidatePath("/admin/company-listings");
  revalidatePath("/company-listings");
  if (data?.company_id) {
    revalidatePath(`/companies/${data.company_id}/dashboard`);
  }
}

export async function rejectCompanyListing(formData: FormData) {
  const id = formData.get("listingId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data, error } = await supabase
    .from("company_listings")
    .update({ status: "rejected" })
    .eq("id", id)
    .select("company_id")
    .maybeSingle();

  if (error) {
    console.error("Failed to reject company listing", error);
  }

  revalidatePath("/admin/company-listings");
  revalidatePath("/company-listings");
  if (data?.company_id) {
    revalidatePath(`/companies/${data.company_id}/dashboard`);
  }
}

export async function updateAutoApprovalMode(formData: FormData) {
  if (!(await canMutateAdmin())) {
    return;
  }

  await setAutoApproveProfessionals(formData.get("autoApprove") === "on");
  revalidatePath("/admin");
}
