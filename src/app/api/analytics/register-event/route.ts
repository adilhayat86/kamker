import { NextResponse } from "next/server";

import { trackAnalyticsEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const allowedEvents = new Set(["register_click", "registration_form_start"]);
const allowedRoles = new Set(["professional", "customer", "company", "unknown"]);

function stringValue(value: unknown) {
  return typeof value === "string" ? value.slice(0, 240) : "";
}

function normalizeSource(source: string, path: string, href: string) {
  const value = source.trim();

  if (value && value !== "unknown") {
    return value.slice(0, 80);
  }

  if (path.startsWith("/register/")) {
    return "direct-or-qr";
  }

  if (href.startsWith("/register") || href.startsWith("https://kamker.com/register")) {
    return "site-navigation";
  }

  return "unknown";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const eventType = stringValue(body.eventType);

    if (!allowedEvents.has(eventType)) {
      return NextResponse.json(
        { ok: true },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const role = allowedRoles.has(stringValue(body.role)) ? stringValue(body.role) : "unknown";
    const path = stringValue(body.path);
    const href = stringValue(body.href);

    await trackAnalyticsEvent({
      eventType: eventType as "register_click" | "registration_form_start",
      targetType: "page",
      metadata: {
        role,
        href,
        path,
        source: normalizeSource(stringValue(body.source), path, href),
        next: stringValue(body.next),
        visitor_id: stringValue(body.visitorId),
        city: stringValue(body.city),
        category: stringValue(body.category),
        referrer_host: stringValue(body.referrerHost),
      },
    });
  } catch (error) {
    console.error("Registration analytics event failed", error);
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
