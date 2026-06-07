"use server";

import { redirect } from "next/navigation";

import { trackAnalyticsEvent } from "@/lib/analytics";
import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import { phoneFieldWithCountry } from "@/lib/phone";
import { createRequirementMatches } from "@/lib/requirement-matching";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendAdminWhatsappAlert } from "@/lib/whatsapp";

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
  const phoneNumber = requiredValue(formData, "phone");
  const whatsappNumber = phoneFieldWithCountry(formData, "whatsapp");
  const urgency = requiredValue(formData, "urgency");
  const details = requiredValue(formData, "details");
  const source = requiredValue(formData, "source") || "unknown";
  const draft = {
    service: requiredService,
    city: cityName,
    area,
    availability,
    budget,
    phone: phoneNumber,
    whatsapp: whatsappNumber,
    urgency,
    details,
  };
  const errors = [
    !requiredService ? "service" : null,
    !cityName ? "city" : null,
    !phoneNumber ? "phone" : null,
    !urgency ? "urgency" : null,
    !details ? "details" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    await saveRequirementDraft({
      ...draft,
      errors: errors.join(","),
    });
    redirect("/send-requirement?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    await saveRequirementDraft(draft);
    redirect("/send-requirement?status=not-configured");
  }

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", cityName)
    .maybeSingle();

  const { data: requirement, error } = await supabase
    .from("requirements")
    .insert({
      required_service: requiredService,
      city_id: city?.id ?? null,
      area: area || null,
      availability: availability || null,
      details,
      budget: budget || null,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber || null,
      urgency,
      broadcast_status: "pending_payment",
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
      `Urgency: ${urgency}`,
      `Phone: ${phoneNumber}`,
      "Admin review needed.",
    ].join("\n"),
    "requirement",
    requirement.id as string,
  );

  await clearRequirementDraft();
  redirect("/send-requirement?status=success");
}
