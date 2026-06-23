"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAdminAudit } from "@/lib/admin-audit";
import { requireAdmin } from "@/lib/admin-auth";
import { setAutoApproveProfessionals } from "@/lib/admin-settings";
import {
  getActiveCompanySubscription,
  getPublishedCompanyListingUsage,
} from "@/lib/company-packages";
import { categorySlug } from "@/lib/marketplace-data";
import { pakistanMobileNormalizedDigits } from "@/lib/phone";
import {
  notifyRequirementSender,
  sendRequirementBroadcast,
} from "@/lib/requirement-broadcast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";

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

export async function updateAdminCategory(formData: FormData) {
  const id = formData.get("categoryId");
  const name = textField(formData, "name");
  const icon = textField(formData, "icon") || "wrench";
  const description = textField(formData, "description");
  const parentId = textField(formData, "parentId");
  const sortOrder = numberField(formData, "sortOrder");

  if (
    typeof id !== "string" ||
    !id ||
    !name ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug: categorySlug(name),
      icon,
      description: description || null,
      parent_id: parentId ? Number(parentId) : null,
      sort_order: sortOrder,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update admin category", error);
    return;
  }

  await recordAdminAudit({
    action: parentId ? "update_subcategory" : "update_category",
    targetType: "category",
    targetId: id,
    metadata: { name, parentId: parentId || null },
  });

  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath(`/categories/${categorySlug(name)}`);
  revalidatePath("/professionals");
  revalidatePath("/register/professional");
  revalidatePath("/register/company");
  revalidatePath("/send-requirement");
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

export async function updateAdminCity(formData: FormData) {
  const id = formData.get("cityId");
  const name = textField(formData, "name").replace(/\s+/g, " ");

  if (
    typeof id !== "string" ||
    !id ||
    !name ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { error } = await supabase
    .from("cities")
    .update({ name })
    .eq("id", id);

  if (error) {
    console.error("Failed to update admin city", error);
    return;
  }

  await recordAdminAudit({
    action: "update_city",
    targetType: "city",
    targetId: id,
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
    .update({ is_active: true, is_banned: false })
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
  redirect("/admin/workers?notice=worker-approved");
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
    .update({ is_active: false, is_banned: false })
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
  redirect("/admin/workers?notice=worker-pending");
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
  const durationDays = parseFeaturedDurationDays(formData.get("featuredDurationDays"));

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("is_active, is_banned, is_featured, featured_until")
    .eq("id", id)
    .maybeSingle();

  if (professionalError || !professional || !professional.is_active || professional.is_banned) {
    console.error("Cannot feature a pending or banned professional", professionalError);
    return;
  }

  const previousFeaturedUntil = (professional.featured_until as string | null) ?? null;
  const featuredUntilValue = extendFeaturedUntil(previousFeaturedUntil, durationDays);

  const { error } = await supabase
    .from("professionals")
    .update({
      is_featured: true,
      featured_until: featuredUntilValue,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to feature professional", error);
    return;
  }

  await recordAdminAudit({
    action: "make_professional_featured",
    targetType: "professional",
    targetId: id,
    metadata: {
      durationDays,
      previousFeaturedUntil,
      featuredUntil: featuredUntilValue,
      wasFeatured: Boolean(professional.is_featured),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath("/admin/featured");
  revalidatePath("/categories", "layout");
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
    return;
  }

  await recordAdminAudit({
    action: "remove_professional_featured",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath("/admin/featured");
  revalidatePath("/categories", "layout");
  revalidatePath("/professionals");
}

export async function banProfessional(formData: FormData) {
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
      is_active: false,
      is_banned: true,
      is_featured: false,
      featured_until: null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to ban professional", error);
  }

  await recordAdminAudit({
    action: "ban_professional",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath("/admin/featured");
  revalidatePath("/professionals");
  revalidatePath(`/professionals/${id}`);
  redirect("/admin/workers?notice=worker-banned");
}

export async function unbanProfessional(formData: FormData) {
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
      is_active: false,
      is_banned: false,
      is_featured: false,
      featured_until: null,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to unban professional", error);
  }

  await recordAdminAudit({
    action: "unban_professional",
    targetType: "professional",
    targetId: id,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath("/admin/featured");
  revalidatePath("/professionals");
  revalidatePath(`/professionals/${id}`);
  redirect("/admin/workers?notice=worker-unbanned");
}

function featuredDurationFromAmount(amountPkr: number) {
  return amountPkr >= 2500 ? 365 : 30;
}

function parseFeaturedDurationDays(value: FormDataEntryValue | null) {
  const durationDays = typeof value === "string" ? Number(value) : 30;
  const allowedDurations = new Set([30, 60, 365]);

  return allowedDurations.has(durationDays) ? durationDays : 30;
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

export async function approveRequirementBroadcastPayment(formData: FormData) {
  const paymentId = formData.get("paymentId");

  if (
    typeof paymentId !== "string" ||
    !paymentId ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: payment, error: paymentError } = await supabase
    .from("requirement_broadcast_payments")
    .select("id, requirement_id, status")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("Failed to load requirement payment before approval", paymentError);
    return;
  }

  await supabase
    .from("requirement_broadcast_payments")
    .update({
      status: "approved",
      broadcast_status: "ready_to_send",
      reviewed_at: new Date().toISOString(),
      admin_notes: "Approved by admin payment review.",
    })
    .eq("id", paymentId);

  await supabase
    .from("proof_reviews")
    .update({ audit_status: "approved" })
    .eq("related_id", paymentId)
    .eq("review_type", "requirement_broadcast");

  await supabase
    .from("requirements")
    .update({ payment_status: "paid", broadcast_status: "ready_to_send" })
    .eq("id", payment.requirement_id);

  const broadcastResult = await sendRequirementBroadcast(String(payment.requirement_id));
  await notifyRequirementSender(String(payment.requirement_id), broadcastResult);

  await supabase
    .from("requirement_broadcast_payments")
    .update({ broadcast_status: broadcastResult.status })
    .eq("id", paymentId);

  await recordAdminAudit({
    action: "approve_requirement_broadcast_payment",
    targetType: "requirement",
    targetId: String(payment.requirement_id),
    metadata: {
      paymentId,
      broadcastStatus: broadcastResult.status,
      sent: broadcastResult.sent,
      failed: broadcastResult.failed,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/requirements");
  revalidatePath(`/admin/requirements/${payment.requirement_id}`);
  revalidatePath(`/send-requirement/${payment.requirement_id}/payment`);
}

export async function rejectRequirementBroadcastPayment(formData: FormData) {
  const paymentId = formData.get("paymentId");

  if (
    typeof paymentId !== "string" ||
    !paymentId ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: payment, error: paymentError } = await supabase
    .from("requirement_broadcast_payments")
    .select("id, requirement_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("Failed to load requirement payment before rejection", paymentError);
    return;
  }

  await supabase
    .from("requirement_broadcast_payments")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      admin_notes: "Rejected by admin payment review.",
      broadcast_status: "rejected",
    })
    .eq("id", paymentId);

  await supabase
    .from("proof_reviews")
    .update({ audit_status: "rejected" })
    .eq("related_id", paymentId)
    .eq("review_type", "requirement_broadcast");

  await supabase
    .from("requirements")
    .update({ payment_status: "rejected", broadcast_status: "payment_rejected" })
    .eq("id", payment.requirement_id);

  await recordAdminAudit({
    action: "reject_requirement_broadcast_payment",
    targetType: "requirement",
    targetId: String(payment.requirement_id),
    metadata: { paymentId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/requirements");
  revalidatePath(`/admin/requirements/${payment.requirement_id}`);
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

export async function removeDisputedProfessionalNumber(formData: FormData) {
  const id = formData.get("professionalId");
  const confirmation = formData.get("confirmRemoveNumber");

  if (
    typeof id !== "string" ||
    !id ||
    confirmation !== "REMOVE NUMBER" ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: professional, error: loadError } = await supabase
    .from("professionals")
    .select("id, phone_number, whatsapp_number")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !professional) {
    console.error("Failed to load professional before disputed phone removal", loadError);
    return;
  }

  const phoneDigits = pakistanMobileNormalizedDigits(professional.phone_number);
  const whatsappDigits = pakistanMobileNormalizedDigits(professional.whatsapp_number);
  const clearWhatsapp = Boolean(phoneDigits && phoneDigits === whatsappDigits);

  const { error } = await supabase
    .from("professionals")
    .update({
      phone_number: null,
      whatsapp_number: clearWhatsapp ? null : professional.whatsapp_number,
      is_phone_verified: false,
      is_active: false,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to remove disputed professional phone number", error);
    return;
  }

  const { error: sessionError } = await supabase
    .from("professional_sessions")
    .delete()
    .eq("professional_id", id);

  if (sessionError) {
    console.error("Failed to clear sessions after disputed phone removal", sessionError);
  }

  await recordAdminAudit({
    action: "remove_disputed_phone",
    targetType: "professional",
    targetId: id,
    metadata: {
      clearedWhatsapp: clearWhatsapp,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/workers");
  revalidatePath("/professionals");
  revalidatePath(`/professionals/${id}`);
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

export async function retryRequirementAdminAlert(formData: FormData) {
  const id = formData.get("requirementId");

  if (
    typeof id !== "string" ||
    !id ||
    !isSupabaseConfigured ||
    !supabase ||
    !(await canMutateAdmin())
  ) {
    return;
  }

  const { data: requirement, error } = await supabase
    .from("requirements")
    .select("id, required_service, phone_number, payment_status, broadcast_status, cities(name)")
    .eq("id", id)
    .maybeSingle();

  if (error || !requirement) {
    console.error("Failed to load requirement before WhatsApp retry", error);
    redirect(`/admin/requirements/${id}?notice=whatsapp-failed`);
  }

  const cityRelation = requirement.cities as
    | { name?: string | null }
    | { name?: string | null }[]
    | null;
  const cityName = Array.isArray(cityRelation)
    ? cityRelation[0]?.name
    : cityRelation?.name;

  const result = await sendAdminWhatsappAlert(
    [
      "New requirement submitted:",
      `Service: ${requirement.required_service}`,
      `City: ${cityName ?? "Not provided"}`,
      `Payment: ${requirement.payment_status ?? "Not provided"}`,
      `Broadcast: ${requirement.broadcast_status ?? "Not provided"}`,
      `Phone: ${requirement.phone_number ?? "Not provided"}`,
      "Admin review needed.",
    ].join("\n"),
    "requirement",
    id,
  );

  await recordAdminAudit({
    action: "retry_requirement_whatsapp_alert",
    targetType: "requirement",
    targetId: id,
    metadata: {
      ok: result.ok,
      providerMessageId: result.ok ? result.providerMessageId ?? null : null,
      error: result.ok ? null : result.error ?? "Unknown WhatsApp alert error.",
    },
  });

  revalidatePath("/admin/requirements");
  revalidatePath(`/admin/requirements/${id}`);
  redirect(`/admin/requirements/${id}?notice=${result.ok ? "whatsapp-sent" : "whatsapp-failed"}`);
}

export async function updateAutoApprovalMode(formData: FormData) {
  if (!(await canMutateAdmin())) {
    return;
  }

  const enabled = formData.get("autoApprove") === "on";

  await setAutoApproveProfessionals(enabled);
  await recordAdminAudit({
    action: "update_auto_approval",
    targetType: "admin_setting",
    targetId: "auto_approve_professionals",
    metadata: { enabled },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?status=${enabled ? "auto-approval-on" : "auto-approval-off"}`);
}
