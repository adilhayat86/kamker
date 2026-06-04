import { NextRequest, NextResponse } from "next/server";

import {
  isWhatsappConfigured,
  sendAdminWhatsappAlert,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function safeError(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    return "Unknown WhatsApp error.";
  }

  try {
    const parsed = JSON.parse(value) as {
      error?: {
        message?: string;
        type?: string;
        code?: number;
        error_subcode?: number;
        fbtrace_id?: string;
      };
    };

    return {
      message: parsed.error?.message ?? "WhatsApp API error.",
      type: parsed.error?.type,
      code: parsed.error?.code,
      error_subcode: parsed.error?.error_subcode,
      fbtrace_id: parsed.error?.fbtrace_id,
    };
  } catch {
    return value.replace(/EAA[A-Za-z0-9_-]+/g, "<redacted>");
  }
}

// TEMPORARY DEBUG ROUTE: remove after production WhatsApp admin alerts are verified.
export async function GET(request: NextRequest) {
  const debugSecret = process.env.DEBUG_SECRET;
  const requestSecret = request.nextUrl.searchParams.get("secret");

  if (!debugSecret || requestSecret !== debugSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Forbidden",
        whatsappConfigured: isWhatsappConfigured(),
        hasAdminNumber: Boolean(process.env.KAMKER_ADMIN_WHATSAPP),
      },
      { status: 403 },
    );
  }

  const result = await sendAdminWhatsappAlert(
    "Kamker production WhatsApp debug alert.",
    "whatsapp_debug",
    "production-debug",
  );

  return NextResponse.json({
    ok: result.ok,
    providerMessageId:
      "providerMessageId" in result && result.providerMessageId
        ? result.providerMessageId
        : undefined,
    error: result.ok ? undefined : safeError(result.error),
    whatsappConfigured: isWhatsappConfigured(),
    hasAdminNumber: Boolean(process.env.KAMKER_ADMIN_WHATSAPP),
  });
}
