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

function queryParam(query: string, key: string, maxLength = 120) {
  try {
    return clean(new URLSearchParams(query).get(key), maxLength);
  } catch {
    return "";
  }
}

function hasProfessionalSearchIntent({
  path,
  query,
  searchTerm,
  category,
  city,
}: {
  path: string;
  query: string;
  searchTerm: string;
  category: string;
  city: string;
}) {
  if (path !== "/professionals") {
    return false;
  }

  if (searchTerm || category || city) {
    return true;
  }

  return [
    "q",
    "category",
    "city",
    "gender",
    "age",
    "availabilityTime",
    "availabilityDays",
    "rate",
    "verified",
  ].some((key) => Boolean(queryParam(query, key)));
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = clean(body.path, 220);
  const query = clean(body.query, 220);
  const source = clean(body.source) || "direct";
  const category = clean(body.category);
  const city = clean(body.city);
  const searchTerm = clean(body.searchTerm);
  const visitorId = clean(body.visitorId, 80);
  const referrerHost = clean(body.referrerHost, 120);

  if (!path || ignoredPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await trackAnalyticsEvent({
    eventType: "view",
    targetType: "page",
    metadata: {
      path,
      query,
      source,
      category,
      city,
      search_term: searchTerm,
      visitor_id: visitorId,
      referrer_host: referrerHost,
    },
  });

  if (
    visitorId &&
    hasProfessionalSearchIntent({
      path,
      query,
      searchTerm,
      category,
      city,
    })
  ) {
    await trackAnalyticsEvent({
      eventType: "search",
      targetType: "professional",
      metadata: {
        path,
        query,
        source,
        category,
        selected_category: queryParam(query, "category"),
        city,
        selected_city: queryParam(query, "city"),
        search_term: searchTerm || category || city || "Filtered search",
        gender: queryParam(query, "gender"),
        age: queryParam(query, "age"),
        availability_time: queryParam(query, "availabilityTime"),
        availability_days: queryParam(query, "availabilityDays"),
        rate: queryParam(query, "rate"),
        verified: queryParam(query, "verified"),
        sort: queryParam(query, "sort"),
        visitor_id: visitorId,
        referrer_host: referrerHost,
      },
    });
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
