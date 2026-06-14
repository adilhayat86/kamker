import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { whatsappDigits } from "@/lib/phone";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type RequirementReportOwner = {
  id: string;
  customer_id: string | null;
  required_service: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  payment_status: string | null;
  broadcast_status: string | null;
};

export type WhatsappReportLog = {
  recipient_phone: string;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export type RequirementBroadcastReport =
  | {
      ok: true;
      requirement: RequirementReportOwner;
      logs: WhatsappReportLog[];
      rows: string[][];
      csv: string;
      filename: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function safeReportError(value: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/EAA[A-Za-z0-9]+/g, "[redacted]")
    .slice(0, 500);
}

function digitsMatch(a: string | null | undefined, b: string | null | undefined) {
  const left = whatsappDigits(a);
  const right = whatsappDigits(b);
  return Boolean(left && right && left === right);
}

async function canAccessRequirementReport(requirement: RequirementReportOwner) {
  if (
    requirement.payment_status === "paid" &&
    ["sent", "partial", "failed", "no_matches"].includes(
      requirement.broadcast_status ?? "",
    )
  ) {
    return true;
  }

  const [professional, customer] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
  ]);

  if (!professional && !customer) {
    return false;
  }

  if (customer?.id && requirement.customer_id === customer.id) {
    return true;
  }

  if (
    customer &&
    (digitsMatch(customer.phone_number, requirement.phone_number) ||
      digitsMatch(customer.phone_number, requirement.whatsapp_number))
  ) {
    return true;
  }

  if (
    professional &&
    (digitsMatch(professional.phone_number, requirement.phone_number) ||
      digitsMatch(professional.phone_number, requirement.whatsapp_number) ||
      digitsMatch(professional.whatsapp_number, requirement.whatsapp_number) ||
      digitsMatch(professional.whatsapp_number, requirement.phone_number))
  ) {
    return true;
  }

  return false;
}

export async function getRequirementBroadcastReport(
  id: string,
): Promise<RequirementBroadcastReport> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      status: 503,
      error: "Supabase is not configured.",
    };
  }

  const { data: requirement, error: requirementError } = await supabase
    .from("requirements")
    .select(
      "id, customer_id, required_service, phone_number, whatsapp_number, payment_status, broadcast_status",
    )
    .eq("id", id)
    .maybeSingle();

  if (requirementError || !requirement) {
    return {
      ok: false,
      status: 404,
      error: "Requirement not found.",
    };
  }

  const requirementOwner = requirement as RequirementReportOwner;

  if (!(await canAccessRequirementReport(requirementOwner))) {
    return {
      ok: false,
      status: 403,
      error: "Login is required to view this report.",
    };
  }

  const { data: logs, error: logsError } = await supabase
    .from("whatsapp_messages")
    .select("recipient_phone, status, provider_message_id, error_message, sent_at, created_at")
    .eq("related_type", "requirement_broadcast")
    .eq("related_id", id)
    .order("created_at", { ascending: true });

  if (logsError) {
    return {
      ok: false,
      status: 500,
      error: "Could not load delivery report.",
    };
  }

  const reportLogs = (logs ?? []) as WhatsappReportLog[];
  const rows = [
    [
      "recipient_phone",
      "send_status",
      "provider_message_id",
      "sent_time",
      "safe_error",
    ],
    ...reportLogs.map((log) => [
      log.recipient_phone,
      log.status,
      log.provider_message_id ?? "",
      log.sent_at ?? log.created_at,
      safeReportError(log.error_message),
    ]),
  ];

  return {
    ok: true,
    requirement: requirementOwner,
    logs: reportLogs,
    rows,
    csv: rows.map((row) => row.map(csvCell).join(",")).join("\n"),
    filename: `kamker-requirement-${id}-broadcast-report.csv`,
  };
}
