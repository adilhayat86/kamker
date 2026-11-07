export type GoogleAdsConversion = "registration" | "call" | "whatsapp";

type ConversionOptions = {
  transactionId?: string;
  onComplete?: () => void;
};

type TagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function googleAdsTagId() {
  const id = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";
  return /^AW-\d+$/.test(id) ? id : "";
}

export function googleAdsDestination(action: GoogleAdsConversion) {
  const destinations = {
    registration: process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION,
    call: process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_CONVERSION,
    whatsapp: process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_CONVERSION,
  };
  const destination = destinations[action]?.trim() ?? "";
  const tag = googleAdsTagId();
  return tag && /^AW-\d+\/[A-Za-z0-9_-]+$/.test(destination) && destination.startsWith(`${tag}/`)
    ? destination
    : "";
}

export function trackGoogleAdsConversion(action: GoogleAdsConversion, options: ConversionOptions = {}) {
  const destination = googleAdsDestination(action);
  if (typeof window === "undefined" || !destination) {
    options.onComplete?.();
    return false;
  }

  const browser = window as TagWindow;
  let completed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (completed) return;
    completed = true;
    if (timer) clearTimeout(timer);
    options.onComplete?.();
  };

  try {
    browser.dataLayer ??= [];
    browser.gtag ??= function (...args: unknown[]) {
      browser.dataLayer!.push(args);
    };
    if (options.onComplete) timer = setTimeout(finish, 350);
    browser.gtag("event", "conversion", {
      send_to: destination,
      ...(options.transactionId ? { transaction_id: options.transactionId } : {}),
      ...(options.onComplete ? { event_callback: finish, event_timeout: 300 } : {}),
    });
    return true;
  } catch {
    finish();
    return false;
  }
}
