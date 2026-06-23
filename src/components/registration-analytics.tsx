"use client";

import { useEffect, useRef, useState } from "react";

const VISITOR_KEY = "kamker_visitor_id";

type RegistrationRole = "professional" | "customer" | "company" | "unknown";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getVisitorId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);

    if (existing) {
      return existing;
    }

    const created = createId();
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return createId();
  }
}

function roleFromPath(pathname: string): RegistrationRole {
  if (pathname.startsWith("/register/professional")) {
    return "professional";
  }

  if (pathname.startsWith("/register/customer")) {
    return "customer";
  }

  if (pathname.startsWith("/register/company")) {
    return "company";
  }

  return "unknown";
}

function safeReferrerHost() {
  if (typeof document === "undefined" || !document.referrer) {
    return "";
  }

  try {
    return new URL(document.referrer).host;
  } catch {
    return "";
  }
}

function sendRegistrationEvent(payload: Record<string, string | null>) {
  try {
    void fetch("/api/analytics/register-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics must never interrupt registration.
  }
}

export function RegistrationClickTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;

      if (!target || typeof (target as Element).closest !== "function") {
        return;
      }

      const link = (target as Element).closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      let url: URL;

      try {
        url = new URL(link.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      if (url.pathname !== "/register" && !url.pathname.startsWith("/register/")) {
        return;
      }

      sendRegistrationEvent({
        eventType: "register_click",
        role: roleFromPath(url.pathname),
        href: `${url.pathname}${url.search}`,
        path: window.location.pathname,
        source: url.searchParams.get("source") || new URLSearchParams(window.location.search).get("source") || "unknown",
        next: url.searchParams.get("next"),
        visitorId: getVisitorId(),
        referrerHost: safeReferrerHost(),
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

export function RegistrationFormAnalytics({
  role,
  source = "",
  next = "",
}: {
  role: Exclude<RegistrationRole, "unknown">;
  source?: string;
  next?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [visitorId, setVisitorId] = useState("");

  useEffect(() => {
    const id = getVisitorId();
    setVisitorId(id);
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;

    if (!form || !visitorId) {
      return;
    }

    const dedupeKey = `kamker_registration_form_start:${role}:${window.location.pathname}`;

    const fireStart = () => {
      try {
        if (window.sessionStorage.getItem(dedupeKey)) {
          return;
        }

        window.sessionStorage.setItem(dedupeKey, "1");
      } catch {
        // Keep sending the event if session storage is blocked.
      }

      const data = new FormData(form);
      sendRegistrationEvent({
        eventType: "registration_form_start",
        role,
        path: window.location.pathname,
        source: source || new URLSearchParams(window.location.search).get("source") || "unknown",
        next,
        visitorId,
        city: typeof data.get("city") === "string" ? String(data.get("city")) : "",
        category: typeof data.get("category") === "string" ? String(data.get("category")) : "",
      });
    };

    form.addEventListener("focusin", fireStart, { once: true });
    form.addEventListener("input", fireStart, { once: true });
    form.addEventListener("change", fireStart, { once: true });

    return () => {
      form.removeEventListener("focusin", fireStart);
      form.removeEventListener("input", fireStart);
      form.removeEventListener("change", fireStart);
    };
  }, [next, role, source, visitorId]);

  return <input ref={inputRef} type="hidden" name="visitorId" value={visitorId} readOnly />;
}
