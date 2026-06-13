import { NextResponse } from "next/server";

import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { whatsappDigits } from "@/lib/phone";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type RouteProps = {
  params: Promise<{ id: string }>;
};

type RequirementReportOwner = {
  id: string;
  customer_id: string | null;
  required_service: string;
  phone_number: string | null;
  whatsapp_number: string | null;
};

type WhatsappReportLog = {
  recipient_phone: string;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function digitsMatch(a: string | null | undefined, b: string | null | undefined) {
  const left = whatsappDigits(a);
  const right = whatsappDigits(b);
  return Boolean(left && right && left === right);
}

function safeError(value: string | null) {
  if (!value) {
    return "";
  }

  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/EAA[A-Za-z0-9]+/g, "[redacted]")
    .slice(0, 500);
}

async function canDownloadReport(requirement: RequirementReportOwner) {
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

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { data: requirement, error: requirementError } = await supabase
    .from("requirements")
    .select("id, customer_id, required_service, phone_number, whatsapp_number")
    .eq("id", id)
    .maybeSingle();

  if (requirementError || !requirement) {
    return NextResponse.json(
      { error: "Requirement not found." },
      { status: 404 },
    );
  }

  const requirementOwner = requirement as RequirementReportOwner;

  if (!(await canDownloadReport(requirementOwner))) {
    return NextResponse.json(
      { error: "Login is required to download this report." },
      { status: 403 },
    );
  }

  const { data: logs, error: logsError } = await supabase
    .from("whatsapp_messages")
    .select("recipient_phone, status, provider_message_id, error_message, sent_at, created_at")
    .eq("related_type", "requirement_broadcast")
    .eq("related_id", id)
    .order("created_at", { ascending: true });

  if (logsError) {
    return NextResponse.json(
      { error: "Could not load delivery report." },
      { status: 500 },
    );
  }

  const rows = [
    [
      "recipient_phone",
      "send_status",
      "provider_message_id",
      "sent_time",
      "safe_error",
    ],
    ...((logs ?? []) as WhatsappReportLog[]).map((log) => [
      log.recipient_phone,
      log.status,
      log.provider_message_id ?? "",
      log.sent_at ?? log.created_at,
      safeError(log.error_message),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="kamker-requirement-${id}-broadcast-report.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
