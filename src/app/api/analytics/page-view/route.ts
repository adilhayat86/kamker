import { NextResponse, type NextRequest } from "next/server";

import { trackAnalyticsEvent } from "@/lib/analytics";

const ignoredPrefixes = [
  "/admin",
  "/account",
  "/api",
  "/login",
  "/logout",
  "/forgot-password",
];

function clean(value: unknown, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = clean(body.path, 220);

  if (!path || ignoredPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await trackAnalyticsEvent({
    eventType: "view",
    targetType: "page",
    metadata: {
      path,
      query: clean(body.query, 220),
      source: clean(body.source) || "direct",
      category: clean(body.category),
      city: clean(body.city),
      search_term: clean(body.searchTerm),
      visitor_id: clean(body.visitorId, 80),
      referrer_host: clean(body.referrerHost, 120),
    },
  });

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
