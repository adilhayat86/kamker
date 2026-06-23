import { trackAnalyticsEvent } from "@/lib/analytics";

export type RegistrationRole = "professional" | "customer" | "company";

export type RegistrationFailureReason =
  | "validation"
  | "duplicate_phone"
  | "invalid_photo"
  | "photo_upload"
  | "database_insert"
  | "not_configured";

type MetadataValue = string | number | boolean | null;

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function compactMetadata(metadata: Record<string, MetadataValue | undefined>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== ""),
  ) as Record<string, MetadataValue>;
}

function registrationMetadata(
  formData: FormData,
  role: RegistrationRole,
  path: string,
  extra: Record<string, MetadataValue | undefined> = {},
) {
  return compactMetadata({
    role,
    path,
    source: field(formData, "source") || "unknown",
    next: field(formData, "next"),
    visitor_id: field(formData, "visitorId"),
    city: field(formData, "city"),
    category: field(formData, "category"),
    ...extra,
  });
}

export async function trackRegistrationSubmitAttempt(
  formData: FormData,
  role: RegistrationRole,
  path: string,
  extra?: Record<string, MetadataValue | undefined>,
) {
  await trackAnalyticsEvent({
    eventType: "registration_submit_attempt",
    targetType: "page",
    metadata: registrationMetadata(formData, role, path, extra),
  });
}

export async function trackRegistrationFailure(
  formData: FormData,
  role: RegistrationRole,
  path: string,
  failureReason: RegistrationFailureReason,
  errorCodes: string[],
  extra?: Record<string, MetadataValue | undefined>,
) {
  await trackAnalyticsEvent({
    eventType: "registration_failed",
    targetType: "page",
    metadata: registrationMetadata(formData, role, path, {
      failure_reason: failureReason,
      error_codes: errorCodes.join(","),
      ...extra,
    }),
  });
}

export async function trackRegistrationSuccess(
  formData: FormData,
  role: RegistrationRole,
  path: string,
  targetId: string,
  targetType: "professional" | "customer" | "company",
  extra?: Record<string, MetadataValue | undefined>,
) {
  await trackAnalyticsEvent({
    eventType: "registration_success",
    targetType,
    targetId,
    metadata: registrationMetadata(formData, role, path, extra),
  });
}
