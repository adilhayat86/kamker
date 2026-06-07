export const countryCodeOptions = [
  { value: "+92", label: "PK +92" },
  { value: "+971", label: "UAE +971" },
  { value: "+966", label: "SA +966" },
  { value: "+44", label: "UK +44" },
  { value: "+1", label: "US +1" },
];

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

  return normalizePhoneNumber(
    typeof value === "string" ? value : "",
    typeof countryCode === "string" ? countryCode : "+92",
  );
}

export function whatsappDigits(value: string | null | undefined) {
  return normalizePakistanPhoneNumber(value).replace(/\D/g, "");
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
