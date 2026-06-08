/*
Paste this into the Codex Node/browser session when the in-app browser clipboard
bridge is unavailable. It fills plain HTML inputs/selects/textareas by DOM name
and dispatches input/change events, which keeps Kamker form validation realistic
without relying on clipboard automation.

Usage inside the browser automation REPL:
  await kamkerSetField("fullName", "Admin Test Worker");
  await kamkerSetField("city", "Karachi");
*/

globalThis.kamkerSetField = async function kamkerSetField(name, value) {
  return tab.playwright.evaluate(
    ({ name, value }) => {
      const selector = `[name="${CSS.escape(name)}"]`;
      const element = document.querySelector(selector);

      if (!element) {
        return { ok: false, name, reason: "missing" };
      }

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) {
        if (element instanceof HTMLInputElement) {
          if (element.type === "checkbox" || element.type === "radio") {
            element.checked = Boolean(value);
          } else {
            element.value = String(value);
          }
        } else {
          element.value = String(value);
        }

        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));

        return {
          ok: true,
          name,
          value:
            element instanceof HTMLInputElement &&
            (element.type === "checkbox" || element.type === "radio")
              ? element.checked
              : element.value,
        };
      }

      return {
        ok: false,
        name,
        reason: `unsupported ${element.tagName.toLowerCase()}`,
      };
    },
    { name, value },
  );
};
