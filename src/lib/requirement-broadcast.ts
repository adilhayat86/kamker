import { revalidatePath } from "next/cache";

import { recordAdminAudit } from "@/lib/admin-audit";
import { whatsappDigits } from "@/lib/phone";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { sendRequirementWhatsappAlert } from "@/lib/whatsapp";

export const REQUIREMENT_BROADCAST_AMOUNT_PKR = 35;

type RequirementForBroadcast = {
  id: string;
  required_service: string;
  area: string | null;
  details: string;
  phone_number: string;
  whatsapp_number: string | null;
  cities: { name: string } | null;
};

type BroadcastMatch = {
  id: string;
  match_score: number;
  professionals: {
    id: string;
    full_name: string;
    phone_number: string | null;
    whatsapp_number: string | null;
    categories: { name: string } | null;
    cities: { name: string } | null;
  } | null;
  company_listings: {
    id: string;
    title: string;
    phone: string | null;
    whatsapp: string | null;
    category: string | null;
    city: string | null;
    companies: { company_name: string } | null;
  } | null;
};

function shortText(value: string, maxLength = 220) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3)}...` : clean;
}

function requirementMessage(requirement: RequirementForBroadcast) {
  const city = requirement.cities?.name ?? "Not provided";
  const location = [requirement.area, city].filter(Boolean).join(", ");
  const contact = requirement.whatsapp_number || requirement.phone_number;

  return [
    `Service: ${requirement.required_service}`,
    `Location: ${location || city}`,
    `Contact: ${contact}`,
    `Details: ${shortText(requirement.details)}`,
  ].join("\n");
}

function matchRecipient(match: BroadcastMatch) {
  const professional = match.professionals;
  const companyListing = match.company_listings;
  const rawPhone =
    professional?.whatsapp_number ||
    professional?.phone_number ||
    companyListing?.whatsapp ||
    companyListing?.phone ||
    "";
  const digits = whatsappDigits(rawPhone);

  if (!digits) {
    return null;
  }

  return {
    digits,
    rawPhone,
    label:
      professional?.full_name ||
      companyListing?.title ||
      companyListing?.companies?.company_name ||
      "Matched professional",
  };
}

export async function sendRequirementBroadcast(requirementId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return {
      status: "failed" as const,
      sent: 0,
      failed: 0,
      skipped: 0,
      totalRecipients: 0,
      error: "Supabase is not configured.",
    };
  }

  const db = supabase;
  const { data: requirement, error: requirementError } = await db
    .from("requirements")
    .select("id, required_service, area, details, phone_number, whatsapp_number, cities(name)")
    .eq("id", requirementId)
    .maybeSingle();

  if (requirementError || !requirement) {
    console.error("Failed to load requirement before broadcast", requirementError);
    return {
      status: "failed" as const,
      sent: 0,
      failed: 0,
      skipped: 0,
      totalRecipients: 0,
      error: "Requirement not found.",
    };
  }

  const { data: matches, error: matchesError } = await db
    .from("requirement_matches")
    .select(
      "id, match_score, professionals(id, full_name, phone_number, whatsapp_number, categories(name), cities(name)), company_listings(id, title, phone, whatsapp, category, city, companies(company_name))",
    )
    .eq("requirement_id", requirementId)
    .order("match_score", { ascending: false });

  if (matchesError) {
    console.error("Failed to load requirement matches before broadcast", matchesError);
    return {
      status: "failed" as const,
      sent: 0,
      failed: 0,
      skipped: 0,
      totalRecipients: 0,
      error: "Requirement matches could not be loaded.",
    };
  }

  const seen = new Set<string>();
  const recipients = ((matches ?? []) as unknown as BroadcastMatch[])
    .map(matchRecipient)
    .filter((recipient): recipient is NonNullable<ReturnType<typeof matchRecipient>> => {
      if (!recipient || seen.has(recipient.digits)) {
        return false;
      }

      seen.add(recipient.digits);
      return true;
    });

  if (recipients.length === 0) {
    await db
      .from("requirements")
      .update({ broadcast_status: "no_matches" })
      .eq("id", requirementId);

    return {
      status: "no_matches" as const,
      sent: 0,
      failed: 0,
      skipped: ((matches ?? []) as unknown[]).length,
      totalRecipients: 0,
      error: null,
    };
  }

  await db
    .from("requirements")
    .update({ broadcast_status: "sending" })
    .eq("id", requirementId);

  const body = requirementMessage(requirement as unknown as RequirementForBroadcast);
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendRequirementWhatsappAlert(
      recipient.rawPhone,
      body,
      requirementId,
    );

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  const status =
    sent === recipients.length
      ? "sent"
      : sent > 0
        ? "partial"
        : "failed";

  await db
    .from("requirements")
    .update({
      broadcast_status: status,
      status: sent > 0 ? "contacted" : "open",
    })
    .eq("id", requirementId);

  await recordAdminAudit({
    action: "send_requirement_broadcast",
    targetType: "requirement",
    targetId: requirementId,
    metadata: {
      sent,
      failed,
      recipients: recipients.length,
      status,
    },
  });

  revalidatePath("/admin/requirements");
  revalidatePath(`/admin/requirements/${requirementId}`);

  return {
    status,
    sent,
    failed,
    skipped: 0,
    totalRecipients: recipients.length,
    error: null,
  };
}
