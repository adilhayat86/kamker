import assert from "node:assert/strict";
import { test } from "node:test";
import { attributeWorkerRegistrations as attribute, hasPaidTraffic, isAcquisitionEntry } from "../../src/lib/registration-attribution.ts";

const at = (minutes) => new Date(Date.UTC(2026, 10, 8, 5, minutes)).toISOString();
const view = (minute, metadata = {}) => ({
  event_type: "view", target_type: "page", target_id: null, created_at: at(minute),
  metadata: { visitor_id: "visitor-a", is_entry: true, referrer_host: "www.google.com", ...metadata },
});
const signup = (minute, changes = {}) => ({
  event_type: "registration_success", target_type: "professional", target_id: "worker-a", created_at: at(minute),
  metadata: { visitor_id: "visitor-a" }, ...changes,
});

test("only a new external document navigation is an acquisition entry", () => {
  assert.equal(isAcquisitionEntry(true, "navigate", "www.google.com", "kamker.com"), true);
  for (const navigation of ["reload", "back_forward"]) {
    assert.equal(isAcquisitionEntry(true, navigation, "www.google.com", "kamker.com"), false);
  }
  assert.equal(isAcquisitionEntry(false, "navigate", "www.google.com", "kamker.com"), false);
  assert.equal(isAcquisitionEntry(true, "navigate", "kamker.com", "kamker.com"), false);
});

test("matches one completed worker signup and includes the exact 30-minute boundary", () => {
  assert.deepEqual(attribute([view(0)], [signup(30)]), { googleOrganic: 1, paid: 0, unattributed: 0, total: 1 });
});

test("does not credit expired visits or visits after registration", () => {
  for (const entries of [[view(0)], [view(32)]]) {
    assert.equal(attribute(entries, [signup(31)]).unattributed, 1);
  }
});

test("internal navigation and refresh do not restart the organic attribution window", () => {
  assert.equal(attribute([view(0), view(25, { is_entry: false })], [signup(31)]).unattributed, 1);
});

test("paid Google and other paid markers are excluded from organic signups", () => {
  for (const metadata of [{ query: "gclid=real-click" }, { query: "utm_source=google&utm_medium=cpc" }, { has_paid_marker: true }, { source: "google-ads" }]) {
    assert.deepEqual(attribute([view(0, metadata)], [signup(10)]), { googleOrganic: 0, paid: 1, unattributed: 0, total: 1 });
  }
  assert.equal(hasPaidTraffic("utm_source=google"), false);
});

test("later paid traffic supersedes an earlier organic entry", () => {
  assert.equal(attribute([view(0), view(5, { is_entry: false, query: "wbraid=click" })], [signup(10)]).paid, 1);
});

test("a later direct entry replaces an earlier organic entry", () => {
  assert.equal(attribute([view(0), view(5, { referrer_host: "" })], [signup(10)]).unattributed, 1);
});

test("missing visitors and historical unmarked entries remain unattributed", () => {
  assert.equal(attribute([view(0, { is_entry: undefined })], [signup(10)]).unattributed, 1);
  assert.equal(attribute([view(0)], [signup(10, { metadata: {} })]).unattributed, 1);
});

test("deduplicates worker IDs, ignores failures and excludes other account types", () => {
  const events = [signup(10), signup(11), signup(12, { event_type: "registration_failed" }), signup(13, { target_type: "company", target_id: "company-a" })];
  assert.equal(attribute([view(0)], events).total, 1);
});

test("context can precede a report boundary without counting out-of-range successes", () => {
  assert.equal(attribute([view(-5)], [signup(0)]).googleOrganic, 1);
});

test("accepts Google country domains but rejects lookalikes and non-search Google products", () => {
  for (const host of ["google.com.pk", "www.google.co.uk", "www.google.de"]) {
    assert.equal(attribute([view(0, { referrer_host: host })], [signup(10)]).googleOrganic, 1);
  }
  for (const host of ["google.com.evil.example", "notgoogle.com", "docs.google.com"]) {
    assert.equal(attribute([view(0, { referrer_host: host })], [signup(10)]).unattributed, 1);
  }
});

test("handles out-of-order rows and invalid timestamps without false matches", () => {
  assert.equal(attribute([view(5, { is_entry: false }), view(0)], [signup(10)]).googleOrganic, 1);
  assert.equal(attribute([{ ...view(0), created_at: "invalid" }], [signup(10)]).unattributed, 1);
});
