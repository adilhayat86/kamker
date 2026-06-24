"use client";

import { useEffect } from "react";

const guardedRegisterPaths = new Set([
  "/register/professional",
  "/register/customer",
  "/register/company",
]);

function isGuardedRegisterPath() {
  const pathname = window.location.pathname.replace(/\/$/, "");
  return guardedRegisterPaths.has(pathname);
}

function markSubmitterBusy(element: HTMLButtonElement | HTMLInputElement) {
  element.disabled = true;
  element.setAttribute("aria-busy", "true");

  if (element instanceof HTMLInputElement) {
    if (!element.dataset.originalValue) {
      element.dataset.originalValue = element.value;
    }
    element.value = "Submitting...";
    return;
  }

  if (!element.dataset.originalText) {
    element.dataset.originalText = element.textContent?.trim() ?? "";
  }

  if (element.childElementCount === 0) {
    element.textContent = "Submitting...";
  }
}

export function RegistrationSubmitGuard() {
  useEffect(() => {
    const submittingForms = new WeakSet<HTMLFormElement>();

    function handleSubmit(event: SubmitEvent) {
      if (!isGuardedRegisterPath()) {
        return;
      }

      if (!(event.target instanceof HTMLFormElement)) {
        return;
      }

      const form = event.target;

      if (submittingForms.has(form)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      submittingForms.add(form);

      const submitter = event.submitter;
      const buttons = Array.from(
        form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
          'button[type="submit"], button:not([type]), input[type="submit"]',
        ),
      );

      if (
        submitter instanceof HTMLButtonElement ||
        submitter instanceof HTMLInputElement
      ) {
        buttons.unshift(submitter);
      }

      Array.from(new Set(buttons)).forEach(markSubmitterBusy);
    }

    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, []);

  return null;
}
