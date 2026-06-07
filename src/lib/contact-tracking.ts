import type { Professional } from "@/lib/marketplace-data";

type ContactEventType = "call_click" | "whatsapp_click";
type ContactTargetType = "professional" | "company" | "company_listing";

export function trackedContactHref({
  href,
  eventType,
  targetType,
  targetId,
  path,
  category,
  city,
}: {
  href: string | null | undefined;
  eventType: ContactEventType;
  targetType: ContactTargetType;
  targetId?: string | null;
  path: string;
  category?: string | null;
  city?: string | null;
}) {
  if (!href) {
    return null;
  }

  const params = new URLSearchParams({
    eventType,
    targetType,
    href,
    path,
  });

  if (targetId) {
    params.set("targetId", targetId);
  }

  if (category) {
    params.set("category", category);
  }

  if (city) {
    params.set("city", city);
  }

  return `/api/analytics/contact?${params.toString()}`;
}

export function trackedProfessionalContactHref({
  href,
  eventType,
  professional,
}: {
  href: string | null | undefined;
  eventType: ContactEventType;
  professional: Professional;
}) {
  return trackedContactHref({
    href,
    eventType,
    targetType: professional.is_company_managed ? "company_listing" : "professional",
    targetId: professional.id,
    path: professional.profileHref ?? `/professionals/${professional.id}`,
    category: professional.role,
    city: professional.city,
  });
}
