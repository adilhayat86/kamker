"use client";

import { useEffect, useRef } from "react";

import { trackGoogleAdsConversion } from "@/lib/google-ads";

export function RegistrationConversion({ eventId }: { eventId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    const storageKey = `kamker_ads_registration:${eventId}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
    } catch {
      // The opaque transaction ID also deduplicates at Google Ads.
    }
    if (trackGoogleAdsConversion("registration", { transactionId: eventId })) {
      sent.current = true;
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        // Registration and navigation must work with storage blocked.
      }
    }
  }, [eventId]);
  return null;
}
