import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  maxLength?: number;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
};

export function FormField({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
  maxLength,
  error,
  required,
  min,
  max,
}: FormFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <Input
        name={name}
        placeholder={placeholder ?? label}
        type={type}
        defaultValue={defaultValue}
        maxLength={maxLength}
        required={required}
        min={min}
        max={max}
        aria-invalid={Boolean(error)}
        className={error ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : undefined}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
};

export function TextAreaField({
  label,
  name,
  placeholder,
  defaultValue,
  error,
  required,
}: TextAreaFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        placeholder={placeholder ?? label}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-red-500 bg-red-50 focus-visible:ring-red-500",
        )}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

type SelectOption = string | { value: string; label: string };

type SelectFieldProps = {
  label: string;
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
};

export function SelectField({
  label,
  name,
  options,
  defaultValue = "",
  placeholder,
  error,
  required,
}: SelectFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-red-500 bg-red-50 focus-visible:ring-red-500",
        )}
      >
        <option value="" disabled>
          {placeholder ?? `Select ${label.toLowerCase()}`}
        </option>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
