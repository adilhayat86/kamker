export const REGISTRATION_ATTRIBUTION_WINDOW_MS = 30 * 60 * 1000;

export type AttributionEvent = {
  event_type: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type WorkerAcquisition = {
  googleOrganic: number;
  paid: number;
  unattributed: number;
  total: number;
};

export function hasPaidTraffic(query: string, source = "") {
  const params = new URLSearchParams(query);
  return ["gclid", "dclid", "gbraid", "wbraid"].some((key) => Boolean(params.get(key))) ||
    /^(cpc|ppc|cpm|display|paid(?:[ _-]?(?:search|social))?)$/i.test(params.get("utm_medium") ?? "") ||
    /^(google[ _-]?ads|adwords|doubleclick)$/i.test(source || params.get("utm_source") || "");
}

export function isAcquisitionEntry(firstDocumentView: boolean, navigationType: string | undefined, referrerHost: string, currentHost: string) {
  return firstDocumentView && (!navigationType || navigationType === "navigate") && referrerHost !== currentHost;
}

function isGoogleSearchHost(host: unknown) {
  return typeof host === "string" &&
    /^(www\.)?google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/i.test(host);
}

function visitor(event: AttributionEvent) {
  const value = event.metadata?.visitor_id;
  return typeof value === "string" ? value.trim() : "";
}

function paid(event: AttributionEvent) {
  return event.metadata?.has_paid_marker === true || hasPaidTraffic(
    typeof event.metadata?.query === "string" ? event.metadata.query : "",
    typeof event.metadata?.source === "string" ? event.metadata.source : "",
  );
}

// Correlation of existing first-party signals, not proof of causation. Historical
// views without an entry marker stay unattributed rather than guessing a source.
export function attributeWorkerRegistrations(
  contextEvents: AttributionEvent[],
  successEvents: AttributionEvent[],
): WorkerAcquisition {
  const result: WorkerAcquisition = { googleOrganic: 0, paid: 0, unattributed: 0, total: 0 };
  const views = contextEvents
    .filter((event) => event.event_type === "view" && event.target_type === "page" && visitor(event))
    .filter((event) => Number.isFinite(Date.parse(event.created_at)))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const successes = successEvents
    .filter((event) => event.event_type === "registration_success" && event.target_type === "professional" && event.target_id)
    .filter((event) => Number.isFinite(Date.parse(event.created_at)))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  const entries = new Map<string, { at: number; channel: "googleOrganic" | "paid" | "unattributed" }>();
  const counted = new Set<string>();
  let viewIndex = 0;

  for (const success of successes) {
    const at = Date.parse(success.created_at);
    while (viewIndex < views.length && Date.parse(views[viewIndex].created_at) <= at) {
      const view = views[viewIndex++];
      const isPaid = paid(view);
      if (view.metadata?.is_entry === true || isPaid) {
        entries.set(visitor(view), {
          at: Date.parse(view.created_at),
          channel: isPaid ? "paid" : isGoogleSearchHost(view.metadata?.referrer_host) ? "googleOrganic" : "unattributed",
        });
      }
    }
    if (counted.has(success.target_id!)) continue;
    counted.add(success.target_id!);
    const entry = entries.get(visitor(success));
    const channel = entry && at - entry.at <= REGISTRATION_ATTRIBUTION_WINDOW_MS
      ? entry.channel
      : "unattributed";
    result[channel]++;
    result.total++;
  }
  return result;
}
