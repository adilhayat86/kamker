"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "kamker_visitor_id";

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);

    if (existing) {
      return existing;
    }

    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(VISITOR_KEY, next);
    return next;
  } catch {
    return "";
  }
}

function titleFromSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function categoryFromPath(pathname: string) {
  if (!pathname.startsWith("/categories/")) {
    return "";
  }

  return titleFromSlug(pathname.replace("/categories/", "").split("/")[0] ?? "");
}

function referrerHost() {
  try {
    return document.referrer ? new URL(document.referrer).host : "";
  } catch {
    return "";
  }
}

export function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  useEffect(() => {
    const source = searchParams.get("source") || searchParams.get("utm_source") || "";
    const category =
      searchParams.get("category") ||
      searchParams.get("service") ||
      categoryFromPath(pathname);
    const city = searchParams.get("city") || "";
    const searchTerm = searchParams.get("q") || searchParams.get("query") || "";

    const payload = {
      path: pathname,
      query: queryString,
      source,
      category,
      city,
      searchTerm,
      visitorId: getVisitorId(),
      referrerHost: referrerHost(),
    };

    void fetch("/api/analytics/page-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, queryString, searchParams]);

  return null;
}
