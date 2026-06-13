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
import {
  REQUIREMENT_BROADCAST_AMOUNT_PKR,
  REQUIREMENT_DETAILS_MAX_LENGTH,
} from "@/lib/requirement-broadcast";
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

function redirectToRequirementForm(
  status: "missing" | "not-configured" | "banned-worker" | "error",
  values: {
    categoryContext?: string;
    subcategoryContext?: string;
    service?: string;
    city?: string;
    area?: string;
    estimate?: string;
    source?: string;
  } = {},
): never {
  const query = new URLSearchParams({ status });

  if (values.categoryContext) {
    query.set("category", values.categoryContext);
  } else if (values.service) {
    query.set("service", values.service);
  }

  if (values.subcategoryContext) {
    query.set("subcategory", values.subcategoryContext);
  }

  if (values.city) {
    query.set("city", values.city);
  }

  if (values.area) {
    query.set("area", values.area);
  }

  if (values.estimate) {
    query.set("estimate", values.estimate);
  }

  if (values.source) {
    query.set("source", values.source);
  }

  redirect(`/send-requirement?${query.toString()}`);
}

export async function submitRequirement(formData: FormData) {
  const requiredService = requiredValue(formData, "service");
  const cityName = requiredValue(formData, "city");
  const area = requiredValue(formData, "area");
  const categoryContext = requiredValue(formData, "categoryContext");
  const subcategoryContext = requiredValue(formData, "subcategoryContext");
  const estimate = requiredValue(formData, "estimate");
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
    details.length > REQUIREMENT_DETAILS_MAX_LENGTH ? "detailsTooLong" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    await saveRequirementDraft({
      ...draft,
      errors: errors.join(","),
    });
    redirectToRequirementForm("missing", {
      categoryContext,
      subcategoryContext,
      service: requiredService,
      city: cityName,
      area,
      estimate,
      source,
    });
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
    redirectToRequirementForm("banned-worker", {
      categoryContext,
      subcategoryContext,
      service: requiredService,
      city: cityName,
      area,
      estimate,
      source,
    });
  }

  if (!isSupabaseConfigured || !supabase) {
    await saveRequirementDraft(draft);
    redirectToRequirementForm("not-configured", {
      categoryContext,
      subcategoryContext,
      service: requiredService,
      city: cityName,
      area,
      estimate,
      source,
    });
  }

  const cityId = await findOrCreateCityId(cityName);

  const { data: requirement, error } = await supabase
    .from("requirements")
    .insert({
      customer_id: customer?.id ?? null,
      required_service: requiredService,
      city_id: cityId,
      area: area || null,
      availability: null,
      details,
      budget: null,
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
    redirectToRequirementForm("error", {
      categoryContext,
      subcategoryContext,
      service: requiredService,
      city: cityName,
      area,
      estimate,
      source,
    });
  }

  await createRequirementMatches({
    id: requirement.id as string,
    requiredService,
    cityName,
    area: area || null,
    availability: null,
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
      `Customer should upload Rs ${REQUIREMENT_BROADCAST_AMOUNT_PKR} per matched recipient.`,
    ].join("\n"),
    "requirement",
    requirement.id as string,
  );

  await clearRequirementDraft();
  redirect(`/send-requirement/${requirement.id as string}/payment`);
}
