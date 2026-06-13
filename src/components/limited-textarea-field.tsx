"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type LimitedTextAreaFieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  maxLength: number;
};

export function LimitedTextAreaField({
  label,
  name,
  placeholder,
  defaultValue = "",
  error,
  required,
  helperText,
  maxLength,
}: LimitedTextAreaFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const helpId = helperText ? `${name}-help` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const counterLabel = useMemo(
    () => `${value.length.toLocaleString("en-PK")} / ${maxLength.toLocaleString("en-PK")}`,
    [maxLength, value.length],
  );

  return (
    <label className="grid gap-2">
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
      <textarea
        name={name}
        placeholder={placeholder ?? label}
        defaultValue={defaultValue}
        maxLength={maxLength}
        required={required}
        aria-describedby={[helpId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => setValue(event.currentTarget.value)}
        className={cn(
          "min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-red-500 bg-red-50 focus-visible:ring-red-500",
        )}
      />
      <div className="flex items-start justify-between gap-3 text-xs leading-5">
        {helperText ? (
          <span id={helpId} className="text-muted-foreground">
            {helperText}
          </span>
        ) : (
          <span />
        )}
        <span className={value.length >= maxLength ? "font-semibold text-red-600" : "text-muted-foreground"}>
          {counterLabel}
        </span>
      </div>
      {error ? (
        <span id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
