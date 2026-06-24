import { countryCodeOptions } from "@/lib/phone";
import { cn } from "@/lib/utils";

const errorFieldClass =
  "!border-red-600 bg-red-50 focus-within:!border-red-600 focus-within:!ring-red-600";

type CountryPhoneFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | null;
  error?: string;
  required?: boolean;
  helperText?: string;
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
  helperText,
}: CountryPhoneFieldProps) {
  const helpId = helperText ? `${name}-help` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </span>
      <div
        className={cn(
          "grid grid-cols-[112px_1fr] overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring",
          error && errorFieldClass,
        )}
      >
        <select
          name={`${name}CountryCode`}
          defaultValue={detectedCountryCode(defaultValue)}
          aria-label={`${label} country code`}
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
          aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={Boolean(error)}
          placeholder="Local mobile number"
          className="h-11 min-w-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {helperText ? (
        <span id={helpId} className="text-xs leading-5 text-muted-foreground">
          {helperText}
        </span>
      ) : null}
      {error ? <span id={errorId} className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
