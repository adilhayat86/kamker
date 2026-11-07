// Runs before paint and after client navigation; it changes only decorative ad slots.
export function updateAdDisplay() {
  const params = new URLSearchParams(window.location.search);
  const fromGoogle = params.get("utm_source")?.toLowerCase() === "google";
  const hasAdClick = ["gclid", "dclid", "gbraid", "wbraid"].some((key) => Boolean(params.get(key)));
  let paidVisit = fromGoogle || hasAdClick || document.documentElement.dataset.kamkerPaidVisit === "true";

  try {
    paidVisit = paidVisit || window.sessionStorage.getItem("kamker_paid_visit") === "true";
    if (paidVisit) window.sessionStorage.setItem("kamker_paid_visit", "true");
  } catch {
    // URL-based suppression still works if browser storage is unavailable.
  }

  document.documentElement.dataset.kamkerPaidVisit = String(paidVisit);
}
