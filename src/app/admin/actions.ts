"use server";

import { revalidatePath } from "next/cache";

import { recordAdminAudit } from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/admin-auth";
import { setAutoApproveProfessionals } from "@/lib/admin-settings";
import {
  getActiveCompanySubscription,
  getPublishedCompanyListingUsage,
} from "@/lib/company-packages";
import { categorySlug } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

async function canMutateAdmin() {
  return requireAdmin();
}

function textField(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function numberField(formData: FormData, key: string) {
  const value = Number(textField(formData, key));

  return Number.isFinite(value) ? value : 0;
}

export async function createAdminCategory(formData: FormData) {
  const name = textField(formData, "name");
  const icon = textField(formData, "icon") || "wrench";
  const description = textField(formData, "description");
  const parentId = textField(formData, "parentId");
  const sortOrder = numberField(formData, "sortOrder");

  if (!name || !isSupabaseConfigured || !supabase || !(await canMutateAdmin())) {
    return;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug: categorySlug(name),
      icon,
      description: description || null,
      parent_id: parentId ? Number(parentId) : null,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create admin category", error);
    return;
  }

  await recordAdminAudit({
    action: parentId ? "create_subcategory" : "create_category",
    targetType: "category",
    targetId: String(data.id),
    metadata: { name, parentId: parentId || null },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
}

export async function createAdminCity(formData: FormData) {
  const name = textField(formData, "name").replace(/\s+/g, " ");

  if (!name || !isSupabaseConfigured || !supabase || !(await canMutateAdmin())) {
    return;
  }

  const { data: existingCity, error: existingError } = await supabase
    .from("cities")
    .select("id")
    .ilike("name", name)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check admin city", existingError);
    return;
  }

  if (existingCity) {
    revalidatePath("/admin/cities");
    return;
  }

  const { data, error } = await supabase
    .from("cities")
    .insert({ name })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create admin city", error);
    return;
  }

  await recordAdminAudit({
    action: "create_city",
    targetType: "city",
    targetId: String(data.id),
    metadata: { name },
  });

  revalidatePath("/");
  revalidatePath("/admin/cities");
  revalidatePath("/categories");
  revalidatePath("/professionals");
  revalidatePath("/register/professional");
  revalidatePath("/register/company");
  revalidatePath("/register/customer");
  revalidatePath("/send-requirement");
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

  await recordAdminAudit({
    action: "approve_professional",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
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

  await recordAdminAudit({
    action: "reject_professional",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
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

  await recordAdminAudit({
    action: "verify_cnic",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workers");
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

  await recordAdminAudit({
    action: "make_professional_featured",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/featured");
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

  await recordAdminAudit({
    action: "remove_professional_featured",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/featured");
  revalidatePath("/professionals");
}

function featuredDurationFromAmount(amountPkr: number) {
  return amountPkr >= 2500 ? 365 : 30;
}

function extendFeaturedUntil(currentValue: string | null, durationDays: number) {
  const now = new Date();
  const currentExpiry = currentValue ? new Date(currentValue) : null;
  const startsAt =
    currentExpiry && currentExpiry > now ? currentExpiry.getTime() : now.getTime();

  return new Date(startsAt + durationDays * 24 * 60 * 60 * 1000).toISOString();
}

export async function activateFeaturedProfileProof(formData: FormData) {
  const proofReviewId = formData.get("proofReviewId");

  if (
    typeof proofReviewId !== "string" ||
    !proofReviewId ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: proofReview, error: proofError } = await supabase
    .from("proof_reviews")
    .select("id, review_type, related_id, expected_amount_pkr")
    .eq("id", proofReviewId)
    .maybeSingle();

  if (
    proofError ||
    !proofReview ||
    proofReview.review_type !== "featured_profile" ||
    !proofReview.related_id
  ) {
    console.error("Failed to load featured profile proof for activation", proofError);
    return;
  }

  const professionalId = String(proofReview.related_id);
  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("featured_until")
    .eq("id", professionalId)
    .maybeSingle();

  if (professionalError || !professional) {
    console.error("Failed to load professional for featured activation", professionalError);
    return;
  }

  const durationDays = featuredDurationFromAmount(
    Number(proofReview.expected_amount_pkr ?? 0),
  );
  const nextFeaturedUntil = extendFeaturedUntil(
    (professional.featured_until as string | null) ?? null,
    durationDays,
  );

  const { error: updateError } = await supabase
    .from("professionals")
    .update({
      is_featured: true,
      featured_until: nextFeaturedUntil,
    })
    .eq("id", professionalId);

  if (updateError) {
    console.error("Failed to activate featured profile proof", updateError);
    return;
  }

  const { error: proofUpdateError } = await supabase
    .from("proof_reviews")
    .update({ audit_status: "approved" })
    .eq("id", proofReviewId);

  if (proofUpdateError) {
    console.error("Failed to approve featured profile proof review", proofUpdateError);
  }

  await recordAdminAudit({
    action: "activate_featured_profile_proof",
    targetType: "professional",
    targetId: professionalId,
    metadata: {
      proofReviewId,
      durationDays,
      featuredUntil: nextFeaturedUntil,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/featured");
  revalidatePath("/admin/workers");
  revalidatePath("/professionals");
  revalidatePath(`/professionals/${professionalId}`);
}

export async function rejectProofReview(formData: FormData) {
  const proofReviewId = formData.get("proofReviewId");

  if (
    typeof proofReviewId !== "string" ||
    !proofReviewId ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: proofReview, error: loadError } = await supabase
    .from("proof_reviews")
    .select("id, review_type, related_id")
    .eq("id", proofReviewId)
    .maybeSingle();

  if (loadError || !proofReview) {
    console.error("Failed to load proof review before rejection", loadError);
    return;
  }

  const { error } = await supabase
    .from("proof_reviews")
    .update({ audit_status: "rejected" })
    .eq("id", proofReviewId);

  if (error) {
    console.error("Failed to reject proof review", error);
    return;
  }

  await recordAdminAudit({
    action: "reject_proof_review",
    targetType: "proof_review",
    targetId: proofReviewId,
    metadata: {
      reviewType: proofReview.review_type,
      relatedId: proofReview.related_id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
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

  await recordAdminAudit({
    action: "delete_professional",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workers");
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

  await recordAdminAudit({
    action: "approve_company_verification",
    targetType: "company",
    targetId: id,
  });

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

  await recordAdminAudit({
    action: "reject_company_verification",
    targetType: "company",
    targetId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
}

export async function activateCompanyPackage(formData: FormData) {
  const companyId = formData.get("companyId");
  const packageKey = formData.get("packageKey");
  const manualPaymentId = formData.get("manualPaymentId");

  if (
    typeof companyId !== "string" ||
    !companyId ||
    typeof packageKey !== "string" ||
    !packageKey ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: companyPackage, error: packageError } = await supabase
    .from("company_packages")
    .select("id, package_key, duration_days, listings_limit, featured_limit")
    .eq("package_key", packageKey)
    .eq("active", true)
    .maybeSingle();

  if (packageError || !companyPackage) {
    console.error("Failed to load package for activation", packageError);
    return;
  }

  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + Number(companyPackage.duration_days));

  const { error: cancelError } = await supabase
    .from("company_package_subscriptions")
    .update({ status: "cancelled" })
    .eq("company_id", companyId)
    .eq("status", "active");

  if (cancelError) {
    console.error("Failed to cancel old company subscription", cancelError);
  }

  const { error: subscriptionError } = await supabase
    .from("company_package_subscriptions")
    .insert({
      company_id: companyId,
      package_id: companyPackage.id,
      manual_payment_id:
        typeof manualPaymentId === "string" && manualPaymentId
          ? manualPaymentId
          : null,
      package_key: companyPackage.package_key,
      listings_limit: companyPackage.listings_limit,
      featured_limit: companyPackage.featured_limit,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "active",
    });

  if (subscriptionError) {
    console.error("Failed to activate company package", subscriptionError);
    return;
  }

  const { error: companyError } = await supabase
    .from("companies")
    .update({ payment_status: "paid" })
    .eq("id", companyId);

  if (companyError) {
    console.error("Failed to update company payment status", companyError);
  }

  if (typeof manualPaymentId === "string" && manualPaymentId) {
    const reviewedAt = new Date().toISOString();

    const { error: paymentError } = await supabase
      .from("manual_payments")
      .update({
        status: "approved",
        reviewed_at: reviewedAt,
        admin_notes: "Approved by admin package activation.",
      })
      .eq("id", manualPaymentId);

    if (paymentError) {
      console.error("Failed to approve manual payment during package activation", paymentError);
    }

    const { error: proofError } = await supabase
      .from("proof_reviews")
      .update({
        audit_status: "approved",
      })
      .eq("related_id", manualPaymentId);

    if (proofError) {
      console.error("Failed to mark linked proof review approved", proofError);
    }
  }

  await recordAdminAudit({
    action: "activate_company_package",
    targetType: "company",
    targetId: companyId,
    metadata: {
      packageKey,
      manualPaymentId:
        typeof manualPaymentId === "string" && manualPaymentId
          ? manualPaymentId
          : null,
    },
  });

  revalidatePath("/admin/companies");
  revalidatePath("/admin/payments");
  revalidatePath(`/companies/${companyId}/dashboard`);
  revalidatePath(`/companies/${companyId}/packages`);
}

export async function rejectManualPayment(formData: FormData) {
  const manualPaymentId = formData.get("manualPaymentId");

  if (
    typeof manualPaymentId !== "string" ||
    !manualPaymentId ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: payment, error: loadError } = await supabase
    .from("manual_payments")
    .select("id, company_id, package_key, status")
    .eq("id", manualPaymentId)
    .maybeSingle();

  if (loadError || !payment) {
    console.error("Failed to load manual payment before rejection", loadError);
    return;
  }

  const reviewedAt = new Date().toISOString();
  const { error: paymentError } = await supabase
    .from("manual_payments")
    .update({
      status: "rejected",
      reviewed_at: reviewedAt,
      admin_notes: "Rejected by admin payment review.",
    })
    .eq("id", manualPaymentId);

  if (paymentError) {
    console.error("Failed to reject manual payment", paymentError);
    return;
  }

  const { error: companyError } = await supabase
    .from("companies")
    .update({ payment_status: "rejected" })
    .eq("id", payment.company_id);

  if (companyError) {
    console.error("Failed to mark company payment rejected", companyError);
  }

  const { error: proofError } = await supabase
    .from("proof_reviews")
    .update({ audit_status: "rejected" })
    .eq("related_id", manualPaymentId)
    .eq("review_type", "company_package");

  if (proofError) {
    console.error("Failed to reject linked company proof review", proofError);
  }

  await recordAdminAudit({
    action: "reject_manual_payment",
    targetType: "manual_payment",
    targetId: manualPaymentId,
    metadata: {
      companyId: payment.company_id,
      packageKey: payment.package_key,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/companies");
  revalidatePath(`/companies/${payment.company_id}/dashboard`);
  revalidatePath(`/companies/${payment.company_id}/packages`);
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

  const { data: existingListing, error: loadError } = await supabase
    .from("company_listings")
    .select("company_id, status")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existingListing) {
    console.error("Failed to load company listing before approval", loadError);
    return;
  }

  const [activeSubscription, usage] = await Promise.all([
    getActiveCompanySubscription(existingListing.company_id as string),
    getPublishedCompanyListingUsage(existingListing.company_id as string),
  ]);

  if (!activeSubscription) {
    console.error("Cannot approve company listing without an active package", id);
    return;
  }

  if (existingListing.status !== "approved" && usage.published >= activeSubscription.listings_limit) {
    console.error("Cannot approve company listing because package quota is full", id);
    return;
  }

  const updatePayload =
    existingListing.status === "approved"
      ? { status: "approved" }
      : { status: "approved", is_featured: false };

  const { data, error } = await supabase
    .from("company_listings")
    .update(updatePayload)
    .eq("id", id)
    .select("company_id")
    .maybeSingle();

  if (error) {
    console.error("Failed to approve company listing", error);
  }

  await recordAdminAudit({
    action: "approve_company_staff",
    targetType: "company_listing",
    targetId: id,
  });

  revalidatePath("/admin/company-listings");
  revalidatePath("/company-listings");
  revalidatePath("/professionals");
  revalidatePath("/categories");
  if (data?.company_id) {
    revalidatePath(`/companies/${data.company_id}/dashboard`);
  }
}

export async function makeCompanyListingFeatured(formData: FormData) {
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

  const { data: listing, error: loadError } = await supabase
    .from("company_listings")
    .select("company_id, status, is_featured")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !listing) {
    console.error("Failed to load company listing before featuring", loadError);
    return;
  }

  const [activeSubscription, usage] = await Promise.all([
    getActiveCompanySubscription(listing.company_id as string),
    getPublishedCompanyListingUsage(listing.company_id as string),
  ]);

  if (!activeSubscription || listing.status !== "approved") {
    console.error("Only approved listings with active packages can be featured", id);
    return;
  }

  if (!listing.is_featured && usage.featured >= activeSubscription.featured_limit) {
    console.error("Cannot feature company listing because featured quota is full", id);
    return;
  }

  const { error } = await supabase
    .from("company_listings")
    .update({ is_featured: true })
    .eq("id", id);

  if (error) {
    console.error("Failed to feature company listing", error);
  }

  await recordAdminAudit({
    action: "make_company_staff_featured",
    targetType: "company_listing",
    targetId: id,
  });

  revalidatePath("/admin/company-listings");
  revalidatePath("/company-listings");
  revalidatePath("/professionals");
  revalidatePath(`/companies/${listing.company_id}/dashboard`);
}

export async function removeCompanyListingFeatured(formData: FormData) {
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
    .update({ is_featured: false })
    .eq("id", id)
    .select("company_id")
    .maybeSingle();

  if (error) {
    console.error("Failed to remove featured company listing", error);
  }

  await recordAdminAudit({
    action: "remove_company_staff_featured",
    targetType: "company_listing",
    targetId: id,
  });

  revalidatePath("/admin/company-listings");
  revalidatePath("/company-listings");
  revalidatePath("/professionals");
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

  await recordAdminAudit({
    action: "reject_company_staff",
    targetType: "company_listing",
    targetId: id,
  });

  revalidatePath("/admin/company-listings");
  revalidatePath("/company-listings");
  if (data?.company_id) {
    revalidatePath(`/companies/${data.company_id}/dashboard`);
  }
}

export async function updateRequirementStatus(formData: FormData) {
  const id = formData.get("requirementId");
  const status = formData.get("status");
  const allowedStatuses = new Set(["open", "contacted", "completed", "spam"]);

  if (
    typeof id !== "string" ||
    !id ||
    typeof status !== "string" ||
    !allowedStatuses.has(status) ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("requirements")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Failed to update requirement status", error);
    return;
  }

  await recordAdminAudit({
    action: "update_requirement_status",
    targetType: "requirement",
    targetId: id,
    metadata: { status },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/requirements/${id}`);
}

export async function updateAutoApprovalMode(formData: FormData) {
  if (!(await canMutateAdmin())) {
    return;
  }

  await setAutoApproveProfessionals(formData.get("autoApprove") === "on");
  await recordAdminAudit({
    action: "update_auto_approval",
    targetType: "admin_setting",
    targetId: "auto_approve_professionals",
    metadata: { enabled: formData.get("autoApprove") === "on" },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}
