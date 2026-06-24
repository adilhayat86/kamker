"use client";

import { useEffect } from "react";

const DEFAULT_STORAGE_KEY = "professional";
const DEFAULT_FIELD_NAMES = ["password", "secretAnswer"];

type RegistrationSensitiveFieldRestoreProps = {
  restoreOnMount: boolean;
  fieldNames?: string[];
  storageKey?: string;
};

export function RegistrationSensitiveFieldRestore({
  restoreOnMount,
  fieldNames = DEFAULT_FIELD_NAMES,
  storageKey = DEFAULT_STORAGE_KEY,
}: RegistrationSensitiveFieldRestoreProps) {
  const fieldNamesKey = fieldNames.join(",");

  useEffect(() => {
    const names = fieldNamesKey
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const storageKeyFor = (name: string) => `kamker_register_${storageKey}_${name}`;
    const safeGet = (key: string) => {
      try {
        return window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    };
    const safeSet = (key: string, value: string) => {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {
        // Registration should still work if mobile privacy settings block storage.
      }
    };
    const safeRemove = (key: string) => {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Ignore storage errors from restricted in-app browsers.
      }
    };

    if (!restoreOnMount) {
      names.forEach((name) => {
        safeRemove(storageKeyFor(name));
      });
    }

    const cleanups = names.map((name) => {
      const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);

      if (!input) {
        return () => {};
      }

      const storedValue = safeGet(storageKeyFor(name));

      if (restoreOnMount && storedValue && !input.value) {
        input.value = storedValue;
      }

      const onInput = () => {
        if (input.value) {
          safeSet(storageKeyFor(name), input.value);
        } else {
          safeRemove(storageKeyFor(name));
        }
      };

      input.addEventListener("input", onInput);
      input.addEventListener("change", onInput);

      return () => {
        input.removeEventListener("input", onInput);
        input.removeEventListener("change", onInput);
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [fieldNamesKey, restoreOnMount, storageKey]);

  return null;
}
