import { revalidatePath } from "next/cache";

import { recordAdminAudit } from "@/lib/admin-audit";
import { whatsappDigits } from "@/lib/phone";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  sendRequirementReportWhatsappAlert,
  sendRequirementWhatsappAlert,
} from "@/lib/whatsapp";

export const REQUIREMENT_BROADCAST_AMOUNT_PKR = 35;
export const REQUIREMENT_DETAILS_MAX_LENGTH = 500;
export const REQUIREMENT_TEMPLATE_BODY_MAX_LENGTH = 900;

export function calculateRequirementBroadcastAmountPkr(recipientCount: number) {
  return REQUIREMENT_BROADCAST_AMOUNT_PKR * Math.max(0, Math.floor(recipientCount));
}

type RequirementForBroadcast = {
  id: string;
  required_service: string;
  area: string | null;
  details: string;
  phone_number: string;
  whatsapp_number: string | null;
  cities: { name: string } | null;
};

export type RequirementBroadcastResult = {
  status: "sent" | "partial" | "failed" | "no_matches";
  sent: number;
  failed: number;
  skipped: number;
  totalRecipients: number;
  error: string | null;
};

type BroadcastMatch = {
  id: string;
  match_score: number;
  professional_id: string | null;
  company_listing_id: string | null;
};

type BroadcastProfessional = {
  id: string;
  full_name: string;
  phone_number: string | null;
  whatsapp_number: string | null;
};

type BroadcastCompanyListing = {
  id: string;
  title: string;
  phone: string | null;
  whatsapp: string | null;
};

type BroadcastRecipientSource = {
  professional: BroadcastProfessional | null;
  companyListing: BroadcastCompanyListing | null;
};

function shortText(value: string, maxLength = 220) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3)}...` : clean;
}

function requirementMessage(requirement: RequirementForBroadcast) {
  const city = requirement.cities?.name ?? "Not provided";
  const location = [requirement.area, city].filter(Boolean).join(", ");
  const contact = requirement.whatsapp_number || requirement.phone_number;
  const prefixLines = [
    `Service: ${requirement.required_service}`,
    `Location: ${location || city}`,
    `Contact: ${contact}`,
  ];
  const detailsPrefix = "Details: ";
  const baseMessage = prefixLines.join("\n");
  const availableDetailsLength = Math.max(
    80,
    REQUIREMENT_TEMPLATE_BODY_MAX_LENGTH - baseMessage.length - detailsPrefix.length - 1,
  );
  const detailsLimit = Math.min(
    REQUIREMENT_DETAILS_MAX_LENGTH,
    availableDetailsLength,
  );

  return [...prefixLines, `${detailsPrefix}${shortText(requirement.details, detailsLimit)}`]
    .join("\n")
    .slice(0, REQUIREMENT_TEMPLATE_BODY_MAX_LENGTH);
}

function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://kamker.com").replace(/\/+$/, "");
}

function reportUrl(requirementId: string) {
  return `${siteBaseUrl()}/send-requirement/${requirementId}/broadcast-report`;
}

function matchRecipient(source: BroadcastRecipientSource) {
  const professional = source.professional;
  const companyListing = source.companyListing;
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
      "Matched professional",
  };
}

async function loadBroadcastMatches(requirementId: string) {
  if (!supabase) {
    return { matches: [], error: "Supabase is not configured." };
  }

  const db = supabase;
  let { data: matchRows, error: matchesError } = await db
    .from("requirement_matches")
    .select("id, match_score, professional_id, company_listing_id")
    .eq("requirement_id", requirementId)
    .order("match_score", { ascending: false });

  if (matchesError?.message.includes("company_listing_id")) {
    const fallbackResult = await db
      .from("requirement_matches")
      .select("id, match_score, professional_id")
      .eq("requirement_id", requirementId)
      .order("match_score", { ascending: false });

    matchRows =
      fallbackResult.data?.map((match) => ({
        ...match,
        company_listing_id: null,
      })) ?? null;
    matchesError = fallbackResult.error;
  }

  if (matchesError) {
    return { matches: [], error: matchesError.message };
  }

  const matches = (matchRows ?? []) as BroadcastMatch[];
  const professionalIds = [
    ...new Set(matches.map((match) => match.professional_id).filter(Boolean)),
  ] as string[];
  const companyListingIds = [
    ...new Set(matches.map((match) => match.company_listing_id).filter(Boolean)),
  ] as string[];

  const [professionalsResult, companyListingsResult] = await Promise.all([
    professionalIds.length
      ? db
          .from("professionals")
          .select("id, full_name, phone_number, whatsapp_number")
          .in("id", professionalIds)
      : Promise.resolve({ data: [], error: null }),
    companyListingIds.length
      ? db
          .from("company_listings")
          .select("id, title, phone, whatsapp")
          .in("id", companyListingIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (professionalsResult.error) {
    return { matches: [], error: professionalsResult.error.message };
  }

  if (companyListingsResult.error) {
    return { matches: [], error: companyListingsResult.error.message };
  }

  const professionals = new Map(
    ((professionalsResult.data ?? []) as BroadcastProfessional[]).map((item) => [
      item.id,
      item,
    ]),
  );
  const companyListings = new Map(
    ((companyListingsResult.data ?? []) as BroadcastCompanyListing[]).map(
      (item) => [item.id, item],
    ),
  );

  return {
    matches: matches.map((match) => ({
      id: match.id,
      match_score: match.match_score,
      professional: match.professional_id
        ? professionals.get(match.professional_id) ?? null
        : null,
      companyListing: match.company_listing_id
        ? companyListings.get(match.company_listing_id) ?? null
        : null,
    })),
    error: null,
  };
}

export async function notifyRequirementSender(
  requirementId: string,
  result: RequirementBroadcastResult,
) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data: requirement, error } = await supabase
    .from("requirements")
    .select("id, required_service, phone_number, whatsapp_number")
    .eq("id", requirementId)
    .maybeSingle();

  if (error || !requirement) {
    console.error("Failed to load requirement before sender report", error);
    return { ok: false, error: "Requirement not found." };
  }

  const recipientPhone = requirement.whatsapp_number || requirement.phone_number;

  if (!recipientPhone) {
    return { ok: false, error: "Requirement sender phone is missing." };
  }

  const sentLabel =
    result.status === "no_matches"
      ? "0"
      : `${result.sent}/${result.totalRecipients}`;
  const deliveryReportUrl = reportUrl(requirementId);
  const body = [
    `Kamker update: your ${requirement.required_service} requirement was sent to ${sentLabel} professionals.`,
    `Delivery report: ${deliveryReportUrl}`,
  ].join(" ");

  return sendRequirementReportWhatsappAlert(
    recipientPhone,
    body,
    requirementId,
    [sentLabel, deliveryReportUrl],
  );
}

export async function sendRequirementBroadcast(
  requirementId: string,
): Promise<RequirementBroadcastResult> {
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

  const { matches, error: matchesError } =
    await loadBroadcastMatches(requirementId);

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
  const recipients = matches
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

    revalidatePath("/admin/requirements");
    revalidatePath(`/admin/requirements/${requirementId}`);
    revalidatePath(`/send-requirement/${requirementId}/payment`);

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
  revalidatePath(`/send-requirement/${requirementId}/payment`);

  return {
    status,
    sent,
    failed,
    skipped: 0,
    totalRecipients: recipients.length,
    error: null,
  };
}
