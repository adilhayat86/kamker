"use client";

import { useEffect } from "react";

const errorFieldMap: Record<string, string> = {
  duplicatePhone: "phone",
  phoneDuplicate: "phone",
  phoneInvalid: "phone",
  whatsappInvalid: "whatsapp",
};

const defaultFieldOrder = [
  "fullName",
  "companyName",
  "category",
  "city",
  "contactPerson",
  "phone",
  "whatsapp",
  "gender",
  "age",
  "availabilityTime",
  "availabilityDays",
  "rate",
  "tagline",
  "description",
  "password",
  "secretQuestion",
  "secretAnswer",
];

function isFocusableField(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLInputElement && element.type === "hidden") {
    return false;
  }

  return !element.hasAttribute("disabled") && element.getClientRects().length > 0;
}

function findField(fieldName: string) {
  const focusTargets = Array.from(
    document.querySelectorAll("[data-registration-focus]"),
  ).filter((element) => element.getAttribute("data-registration-focus") === fieldName);
  const explicitTarget = focusTargets.find(isFocusableField);

  if (explicitTarget) {
    return explicitTarget;
  }

  const namedTarget = Array.from(document.getElementsByName(fieldName)).find(isFocusableField);

  if (namedTarget) {
    return namedTarget;
  }

  return Array.from(document.querySelectorAll('[aria-invalid="true"]')).find(isFocusableField);
}

type RegistrationErrorFocusProps = {
  errors: string[];
  fieldOrder?: string[];
};

export function RegistrationErrorFocus({
  errors,
  fieldOrder = defaultFieldOrder,
}: RegistrationErrorFocusProps) {
  useEffect(() => {
    if (errors.length === 0) {
      return;
    }

    const normalizedErrors = errors.map((error) => errorFieldMap[error] ?? error);
    const firstField = fieldOrder.find((field) => normalizedErrors.includes(field));
    const target = firstField ? findField(firstField) : null;

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      target.focus({ preventScroll: true });
    }, 250);
  }, [errors, fieldOrder]);

  return null;
}
