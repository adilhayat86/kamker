import { countryCodeOptions } from "@/lib/phone";
import { cn } from "@/lib/utils";

type CountryPhoneFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | null;
  error?: string;
  required?: boolean;
};

function detectedCountryCode(value: string | null | undefined) {
  const raw = value?.trim() ?? "";
  const digits = raw.replace(/\D/g, "");

  return (
    countryCodeOptions.find((option) =>
      digits.startsWith(option.value.replace(/\D/g, "")),
    )?.value ?? "+92"
  );
}

function localPhoneValue(value: string | null | undefined) {
  const raw = value?.trim() ?? "";
  const digits = raw.replace(/\D/g, "");
  const countryCode = detectedCountryCode(raw);
  const countryDigits = countryCode.replace(/\D/g, "");

  if (digits.startsWith(countryDigits) && digits.length > countryDigits.length) {
    const localDigits = digits.slice(countryDigits.length);
    return countryCode === "+92" ? `0${localDigits}` : localDigits;
  }

  return raw;
}

export function CountryPhoneField({
  label,
  name,
  defaultValue,
  error,
  required = false,
}: CountryPhoneFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div
        className={cn(
          "grid grid-cols-[112px_1fr] overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring",
          error && "border-red-500 bg-red-50 focus-within:ring-red-500",
        )}
      >
        <select
          name={`${name}CountryCode`}
          defaultValue={detectedCountryCode(defaultValue)}
          className="h-11 border-r bg-background px-2 text-sm outline-none"
        >
          {countryCodeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          name={name}
          type="tel"
          inputMode="tel"
          defaultValue={localPhoneValue(defaultValue)}
          required={required}
          aria-invalid={Boolean(error)}
          placeholder="300 5314191"
          className="h-11 min-w-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
