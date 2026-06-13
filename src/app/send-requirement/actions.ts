"use server";

import { redirect } from "next/navigation";

import { trackAnalyticsEvent } from "@/lib/analytics";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import {
  normalizePakistanMobilePhone,
  validatePhoneFieldWithCountry,
} from "@/lib/phone";
import { createRequirementMatches } from "@/lib/requirement-matching";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { findOrCreateCityId } from "@/lib/taxonomy";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";
import { workerPostingBlockedStatus } from "@/lib/worker-status";

function requiredValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

const requirementDraftKey = "send_requirement";
const requirementDraftPath = "/send-requirement";

async function saveRequirementDraft(values: Record<string, string | number>) {
  await saveFormDraft(requirementDraftKey, values, {
    path: requirementDraftPath,
  });
}

async function clearRequirementDraft() {
  await clearFormDraft(requirementDraftKey, {
    path: requirementDraftPath,
  });
}

export async function submitRequirement(formData: FormData) {
  const requiredService = requiredValue(formData, "service");
  const cityName = requiredValue(formData, "city");
  const area = requiredValue(formData, "area");
  const availability = requiredValue(formData, "availability");
  const budget = requiredValue(formData, "budget");
  const phoneInput = requiredValue(formData, "phone");
  const phoneValidation = normalizePakistanMobilePhone(phoneInput);
  const phoneNumber = phoneValidation.normalized || phoneInput;
  const whatsappValidation = validatePhoneFieldWithCountry(formData, "whatsapp");
  const whatsappNumber = whatsappValidation.normalized;
  const details = requiredValue(formData, "details");
  const source = requiredValue(formData, "source") || "unknown";
  const draft = {
    service: requiredService,
    city: cityName,
    area,
    availability,
    budget,
    phone: phoneInput,
    whatsapp: whatsappNumber,
    details,
  };
  const errors = [
    !requiredService ? "service" : null,
    !cityName ? "city" : null,
    !phoneInput ? "phone" : null,
    phoneInput && !phoneValidation.ok ? "phoneInvalid" : null,
    !whatsappValidation.ok ? "whatsappInvalid" : null,
    !details ? "details" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    await saveRequirementDraft({
      ...draft,
      errors: errors.join(","),
    });
    redirect("/send-requirement?status=missing");
  }

  const [professional, customer] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
  ]);

  if (!professional && !customer) {
    await saveRequirementDraft(draft);
    redirect(`/login?status=login-required&next=${encodeURIComponent("/send-requirement")}`);
  }

  const blockedStatus = workerPostingBlockedStatus(professional);

  if (blockedStatus === "banned") {
    await saveRequirementDraft(draft);
    redirect("/send-requirement?status=banned-worker");
  }

  if (!isSupabaseConfigured || !supabase) {
    await saveRequirementDraft(draft);
    redirect("/send-requirement?status=not-configured");
  }

  const cityId = await findOrCreateCityId(cityName);

  const { data: requirement, error } = await supabase
    .from("requirements")
    .insert({
      customer_id: customer?.id ?? null,
      required_service: requiredService,
      city_id: cityId,
      area: area || null,
      availability: availability || null,
      details,
      budget: budget || null,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber || null,
      urgency: "Immediate",
      broadcast_status: "pending_payment",
      payment_status: "unpaid",
      status: "open",
    })
    .select("id")
    .single();

  if (error || !requirement) {
    console.error("Failed to submit requirement", error);
    await saveRequirementDraft(draft);
    redirect("/send-requirement?status=error");
  }

  await createRequirementMatches({
    id: requirement.id as string,
    requiredService,
    cityName,
    area: area || null,
    availability: availability || null,
  });

  await trackAnalyticsEvent({
    eventType: "requirement_submission",
    targetType: "requirement",
    targetId: requirement.id as string,
    metadata: {
      category: requiredService,
      city: cityName,
      source,
      path: "/send-requirement",
    },
  });

  await sendAdminWhatsappAlert(
    [
      "New requirement submitted:",
      `Service: ${requiredService}`,
      `City: ${cityName}`,
      "Broadcast: pending payment",
      `Phone: ${phoneNumber}`,
      "Customer should upload Rs 35 payment proof.",
    ].join("\n"),
    "requirement",
    requirement.id as string,
  );

  await clearRequirementDraft();
  redirect(`/send-requirement/${requirement.id as string}/payment`);
}
