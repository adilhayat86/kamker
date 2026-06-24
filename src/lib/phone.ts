export const countryCodeOptions = [
  { value: "+92", label: "PK +92" },
  { value: "+971", label: "UAE +971" },
  { value: "+966", label: "SA +966" },
  { value: "+44", label: "UK +44" },
  { value: "+1", label: "US +1" },
];

export type PhoneValidationResult = {
  ok: boolean;
  normalized: string;
  error?: "missing" | "invalid" | "fake";
};

export function validatePhoneDigits(value: string | null | undefined) {
  const raw = (value ?? "").trim();

  if (!raw) {
    return { ok: false, normalized: "", error: "missing" } satisfies PhoneValidationResult;
  }

  if (/[^0-9+\s().-]/.test(raw)) {
    return { ok: false, normalized: "", error: "invalid" } satisfies PhoneValidationResult;
  }

  const digits = raw.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    return { ok: false, normalized: "", error: "invalid" } satisfies PhoneValidationResult;
  }

  if (/^(\d)\1+$/.test(digits)) {
    return { ok: false, normalized: "", error: "fake" } satisfies PhoneValidationResult;
  }

  return { ok: true, normalized: digits } satisfies PhoneValidationResult;
}

export function normalizePakistanMobilePhone(value: string | null | undefined) {
  const basic = validatePhoneDigits(value);

  if (!basic.ok) {
    return basic;
  }

  let digits = basic.normalized;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("92")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (!/^3\d{9}$/.test(digits)) {
    return { ok: false, normalized: "", error: "invalid" } satisfies PhoneValidationResult;
  }

  if (/^3(\d)\1{8}$/.test(digits)) {
    return { ok: false, normalized: "", error: "fake" } satisfies PhoneValidationResult;
  }

  return { ok: true, normalized: `+92${digits}` } satisfies PhoneValidationResult;
}

export function pakistanMobileNormalizedDigits(value: string | null | undefined) {
  const result = normalizePakistanMobilePhone(value);
  return result.ok ? result.normalized.replace(/\D/g, "") : "";
}

export function normalizeInternationalPhone(
  value: string | null | undefined,
  countryCode = "+92",
) {
  const basic = validatePhoneDigits(value);

  if (!basic.ok) {
    return basic;
  }

  const normalized = normalizePhoneNumber(value, countryCode);
  const digits = normalized.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    return { ok: false, normalized: "", error: "invalid" } satisfies PhoneValidationResult;
  }

  return { ok: true, normalized } satisfies PhoneValidationResult;
}

export function normalizePhoneNumber(
  value: string | null | undefined,
  countryCode = "+92",
) {
  const raw = (value ?? "").trim();

  if (!raw) {
    return "";
  }

  let digits = raw.replace(/\D/g, "");
  const countryDigits = countryCode.replace(/\D/g, "") || "92";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (raw.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith(countryDigits)) {
    return `+${digits}`;
  }

  if (countryDigits === "92" && digits.startsWith("0")) {
    return `+92${digits.slice(1)}`;
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return `+${countryDigits}${digits}`;
}

export function normalizePakistanPhoneNumber(value: string | null | undefined) {
  return normalizePhoneNumber(value, "+92");
}

export function phoneFieldWithCountry(formData: FormData, key: string) {
  const value = formData.get(key);
  const countryCode = formData.get(`${key}CountryCode`);

  const rawValue = typeof value === "string" ? value : "";

  if (!rawValue.trim()) {
    return "";
  }

  return normalizeInternationalPhone(
    typeof value === "string" ? value : "",
    typeof countryCode === "string" ? countryCode : "+92",
  ).normalized;
}

export function validatePhoneFieldWithCountry(formData: FormData, key: string) {
  const value = formData.get(key);
  const countryCode = formData.get(`${key}CountryCode`);
  const rawValue = typeof value === "string" ? value : "";

  if (!rawValue.trim()) {
    return { ok: true, normalized: "" } satisfies PhoneValidationResult;
  }

  return normalizeInternationalPhone(
    rawValue,
    typeof countryCode === "string" ? countryCode : "+92",
  );
}

export function whatsappDigits(value: string | null | undefined) {
  const raw = (value ?? "").trim();

  if (!raw) {
    return "";
  }

  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (raw.startsWith("00")) {
    return digits.slice(2);
  }

  if (raw.startsWith("+")) {
    return digits;
  }

  const knownCountry = countryCodeOptions.find((option) =>
    digits.startsWith(option.value.replace(/\D/g, "")),
  );

  if (knownCountry) {
    return digits;
  }

  return normalizePakistanPhoneNumber(raw).replace(/\D/g, "");
}

export function whatsappHref(
  value: string | null | undefined,
  message?: string,
) {
  const digits = whatsappDigits(value);

  if (!digits) {
    return null;
  }

  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${encodedMessage}`;
}
