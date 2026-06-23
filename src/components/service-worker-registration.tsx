"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // The app should keep working even if service worker registration fails.
      });
    });
  }, []);

  return null;
}
