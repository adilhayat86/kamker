type TagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function googleAdsTagId() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";
  return /^AW-\d+$/.test(id) ? id : "";
}

export function googleAdsRegistrationDestination() {
  const destination = process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION?.trim() ?? "";
  const tag = googleAdsTagId();
  return tag && /^AW-\d+\/[A-Za-z0-9_-]+$/.test(destination) && destination.startsWith(`${tag}/`)
    ? destination
    : "";
}

export function trackGoogleAdsRegistration(transactionId: string) {
  const destination = googleAdsRegistrationDestination();
  if (typeof window === "undefined" || !destination || !transactionId) {
    return false;
  }

  const browser = window as TagWindow;
  try {
    browser.dataLayer ??= [];
    browser.gtag ??= function (...args: unknown[]) {
      browser.dataLayer!.push(args);
    };
    browser.gtag("event", "conversion", {
      send_to: destination,
      transaction_id: transactionId,
    });
    return true;
  } catch {
    return false;
  }
}
