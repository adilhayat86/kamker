import { trackAnalyticsEvent } from "@/lib/analytics";

export type RegistrationRole = "professional" | "customer" | "company";

export type RegistrationFailureReason =
  | "validation"
  | "invalid_phone"
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

function normalizeRegistrationSource(source: string, path: string) {
  const value = source.trim();

  if (value && value !== "unknown") {
    return value.slice(0, 80);
  }

  if (path.startsWith("/register/")) {
    return "direct-or-qr";
  }

  return "unknown";
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
    source: normalizeRegistrationSource(field(formData, "source"), path),
    next: field(formData, "next"),
    visitor_id: field(formData, "visitorId"),
    city: field(formData, "city"),
    category: field(formData, "category"),
    ...extra,
  });
}

export function registrationFailureReasonForErrors(
  errors: string[],
): RegistrationFailureReason {
  return errors.includes("phoneInvalid") ? "invalid_phone" : "validation";
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
