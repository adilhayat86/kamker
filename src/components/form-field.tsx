import type { HTMLInputTypeAttribute, InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const errorFieldClass =
  "!border-red-600 bg-red-50 focus:border-red-600 focus-visible:!border-red-600 focus-visible:!ring-red-600";

type FieldLabelProps = {
  label: string;
  required?: boolean;
};

function FieldLabel({ label, required }: FieldLabelProps) {
  return (
    <span className="text-sm font-medium">
      {label}
      {required ? (
        <>
          <span aria-hidden="true" className="ml-1 text-red-600">
            *
          </span>
          <span className="sr-only"> required</span>
        </>
      ) : null}
    </span>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  defaultValue?: string;
  maxLength?: number;
  autoComplete?: string;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
  helperText?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  title?: string;
};

export function FormField({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
  maxLength,
  autoComplete,
  error,
  required,
  min,
  max,
  helperText,
  inputMode,
  pattern,
  title,
}: FormFieldProps) {
  const helpId = helperText ? `${name}-help` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label className="grid gap-2">
      <FieldLabel label={label} required={required} />
      <Input
        name={name}
        placeholder={placeholder ?? label}
        type={type}
        defaultValue={defaultValue}
        maxLength={maxLength}
        autoComplete={autoComplete}
        required={required}
        min={min}
        max={max}
        inputMode={inputMode}
        pattern={pattern}
        title={title}
        aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className={error ? errorFieldClass : undefined}
      />
      {helperText ? (
        <span id={helpId} className="text-xs leading-5 text-muted-foreground">
          {helperText}
        </span>
      ) : null}
      {error ? <span id={errorId} className="text-xs font-medium text-red-600">{error}</span> : null}
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
  helperText?: string;
};

export function TextAreaField({
  label,
  name,
  placeholder,
  defaultValue,
  error,
  required,
  helperText,
}: TextAreaFieldProps) {
  const helpId = helperText ? `${name}-help` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label className="grid gap-2">
      <FieldLabel label={label} required={required} />
      <textarea
        name={name}
        placeholder={placeholder ?? label}
        defaultValue={defaultValue}
        required={required}
        aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && errorFieldClass,
        )}
      />
      {helperText ? (
        <span id={helpId} className="text-xs leading-5 text-muted-foreground">
          {helperText}
        </span>
      ) : null}
      {error ? <span id={errorId} className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

type SelectOption = string | { value: string; label: string };

type SelectFieldProps = {
  label: string;
  name: string;
  options: readonly SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
};

export function SelectField({
  label,
  name,
  options,
  defaultValue = "",
  placeholder,
  error,
  required,
  helperText,
}: SelectFieldProps) {
  const helpId = helperText ? `${name}-help` : undefined;
  const errorId = error ? `${name}-error` : undefined;

  return (
    <label className="grid gap-2">
      <FieldLabel label={label} required={required} />
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && errorFieldClass,
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
      {helperText ? (
        <span id={helpId} className="text-xs leading-5 text-muted-foreground">
          {helperText}
        </span>
      ) : null}
      {error ? <span id={errorId} className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
