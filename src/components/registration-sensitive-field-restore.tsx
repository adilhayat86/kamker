"use client";

import { useEffect } from "react";

const STORAGE_PREFIX = "kamker_register_professional_";
const FIELD_NAMES = ["password", "secretAnswer"];

type RegistrationSensitiveFieldRestoreProps = {
  restoreOnMount: boolean;
};

export function RegistrationSensitiveFieldRestore({
  restoreOnMount,
}: RegistrationSensitiveFieldRestoreProps) {
  useEffect(() => {
    if (!restoreOnMount) {
      FIELD_NAMES.forEach((name) => {
        window.sessionStorage.removeItem(`${STORAGE_PREFIX}${name}`);
      });
    }

    const cleanups = FIELD_NAMES.map((name) => {
      const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);

      if (!input) {
        return () => {};
      }

      const storedValue = window.sessionStorage.getItem(`${STORAGE_PREFIX}${name}`);

      if (restoreOnMount && storedValue && !input.value) {
        input.value = storedValue;
      }

      const onInput = () => {
        window.sessionStorage.setItem(`${STORAGE_PREFIX}${name}`, input.value);
      };

      input.addEventListener("input", onInput);

      return () => input.removeEventListener("input", onInput);
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [restoreOnMount]);

  return null;
}
