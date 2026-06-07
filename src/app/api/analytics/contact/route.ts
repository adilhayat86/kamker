import { NextResponse, type NextRequest } from "next/server";

import { trackAnalyticsEvent } from "@/lib/analytics";

const allowedEvents = new Set(["call_click", "whatsapp_click"]);
const allowedTargetTypes = new Set(["professional", "company_listing"]);

function safeDestination(value: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith("tel:") || value.startsWith("https://wa.me/")) {
    return value;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const eventType = params.get("eventType") ?? "";
  const targetType = params.get("targetType") ?? "";
  const targetId = params.get("targetId") ?? "";
  const href = safeDestination(params.get("href"));

  if (!href) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (allowedEvents.has(eventType) && allowedTargetTypes.has(targetType)) {
    await trackAnalyticsEvent({
      eventType: eventType as "call_click" | "whatsapp_click",
      targetType: targetType as "professional" | "company_listing",
      targetId,
      metadata: {
        path: params.get("path") ?? "",
        category: params.get("category") ?? "",
        city: params.get("city") ?? "",
      },
    });
  }

  return NextResponse.redirect(href);
}
