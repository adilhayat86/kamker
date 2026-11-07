import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { googleAdsDestination, trackGoogleAdsConversion } from "../../src/lib/google-ads.ts";

const keys = [
  "NEXT_PUBLIC_GOOGLE_ADS_ID",
  "NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION",
  "NEXT_PUBLIC_GOOGLE_ADS_CALL_CONVERSION",
  "NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_CONVERSION",
];
const originalEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
afterEach(() => {
  delete globalThis.window;
  for (const key of keys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

function configure() {
  for (const key of keys) delete process.env[key];
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-123456789";
}

test("unconfigured conversion never blocks the contact action or sends an event", () => {
  configure();
  let finished = 0;
  globalThis.window = {};
  assert.equal(trackGoogleAdsConversion("call", { onComplete: () => finished++ }), false);
  assert.equal(finished, 1);
  assert.equal(globalThis.window.dataLayer, undefined);
});

test("rejects malformed destinations and destinations for a different Ads account", () => {
  configure();
  for (const value of ["TAG_ID/LABEL", "AW-9999999/test", "AW-123456789/", "AW-123456789/test<script>"]) {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_CONVERSION = value;
    assert.equal(googleAdsDestination("call"), "");
  }
});

test("registration reports the opaque transaction ID without personal or invented revenue fields", () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION = "AW-123456789/registered";
  const sent = [];
  globalThis.window = { gtag: (...args) => sent.push(args) };
  assert.equal(trackGoogleAdsConversion("registration", { transactionId: "opaque-event-id" }), true);
  assert.deepEqual(sent, [["event", "conversion", {
    send_to: "AW-123456789/registered",
    transaction_id: "opaque-event-id",
  }]]);
});

test("navigation completes only once if Google's callback is repeated", () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_CONVERSION = "AW-123456789/contact";
  let finished = 0;
  globalThis.window = { gtag: (_event, _name, data) => {
    data.event_callback();
    data.event_callback();
  } };
  trackGoogleAdsConversion("whatsapp", { onComplete: () => finished++ });
  assert.equal(finished, 1);
});

test("a blocked Google tag cannot leave a visitor waiting indefinitely", async () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_CONVERSION = "AW-123456789/contact";
  let finished = 0;
  globalThis.window = { gtag: () => {} };
  trackGoogleAdsConversion("call", { onComplete: () => finished++ });
  await new Promise(resolve => setTimeout(resolve, 450));
  assert.equal(finished, 1);
});

test("a tag exception still releases contact navigation", () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CALL_CONVERSION = "AW-123456789/contact";
  let finished = 0;
  globalThis.window = { gtag: () => { throw new Error("blocked"); } };
  assert.equal(trackGoogleAdsConversion("call", { onComplete: () => finished++ }), false);
  assert.equal(finished, 1);
});
