"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const OTHER_VALUE = "__other__";
const errorFieldClass =
  "!border-red-600 bg-red-50 focus:border-red-600 focus-visible:!border-red-600 focus-visible:!ring-red-600";

type ProfessionCategoryFieldProps = {
  options: string[];
  defaultValue?: string;
  error?: string;
};

export function ProfessionCategoryField({
  options,
  defaultValue = "",
  error,
}: ProfessionCategoryFieldProps) {
  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b, "en")),
    [options],
  );
  const defaultIsKnown = sortedOptions.includes(defaultValue);
  const [selectedValue, setSelectedValue] = useState(
    defaultValue && !defaultIsKnown ? OTHER_VALUE : defaultValue,
  );
  const [otherValue, setOtherValue] = useState(defaultIsKnown ? "" : defaultValue);
  const isOther = selectedValue === OTHER_VALUE;
  const submittedValue = isOther ? otherValue.trim() : selectedValue;

  return (
    <div className="grid gap-2">
      <label className="grid gap-2">
        <span className="text-sm font-medium">
          Profession/category
          <span aria-hidden="true" className="ml-1 text-red-600">*</span>
          <span className="sr-only"> required</span>
        </span>
        <select
          data-registration-focus="category"
          value={selectedValue}
          onChange={(event) => setSelectedValue(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby="profession-category-help"
          className={cn(
            "h-11 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
            error && errorFieldClass,
          )}
          required
        >
          <option value="" disabled>
            Select profession/category
          </option>
          {sortedOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={OTHER_VALUE}>Other</option>
        </select>
      </label>
      <span id="profession-category-help" className="text-xs leading-5 text-muted-foreground">
        Choose the service customers will search for first.
      </span>

      {isOther ? (
        <label className="grid gap-2">
          <span className="text-sm font-medium">
            What profession?
            <span aria-hidden="true" className="ml-1 text-red-600">*</span>
            <span className="sr-only"> required</span>
          </span>
          <Input
            value={otherValue}
            onChange={(event) => setOtherValue(event.target.value)}
            placeholder="Write your profession"
            aria-invalid={Boolean(error)}
            className={error ? errorFieldClass : undefined}
            required
          />
        </label>
      ) : null}

      <input name="category" type="hidden" value={submittedValue} />

      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </div>
  );
}
