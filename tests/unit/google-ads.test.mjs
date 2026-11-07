import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { googleAdsRegistrationDestination, trackGoogleAdsRegistration } from "../../src/lib/google-ads.ts";

const keys = [
  "NEXT_PUBLIC_GOOGLE_ADS_ID",
  "NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION",
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

test("unconfigured registration tracking sends no event", () => {
  configure();
  globalThis.window = {};
  assert.equal(trackGoogleAdsRegistration("opaque-event-id"), false);
  assert.equal(globalThis.window.dataLayer, undefined);
});

test("registration tracking does nothing on the server", () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION = "AW-123456789/registered";
  assert.equal(trackGoogleAdsRegistration("opaque-event-id"), false);
});

test("rejects malformed destinations and destinations for a different Ads account", () => {
  configure();
  for (const value of ["TAG_ID/LABEL", "AW-9999999/test", "AW-123456789/", "AW-123456789/test<script>"]) {
    process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION = value;
    assert.equal(googleAdsRegistrationDestination(), "");
  }
});

test("registration reports the opaque transaction ID without personal or invented revenue fields", () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION = "AW-123456789/registered";
  const sent = [];
  globalThis.window = { gtag: (...args) => sent.push(args) };
  assert.equal(trackGoogleAdsRegistration("opaque-event-id"), true);
  assert.deepEqual(sent, [["event", "conversion", {
    send_to: "AW-123456789/registered",
    transaction_id: "opaque-event-id",
  }]]);
});

test("registration is queued when the Google tag has not initialized", () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION = "AW-123456789/registered";
  globalThis.window = {};
  assert.equal(trackGoogleAdsRegistration("opaque-event-id"), true);
  assert.deepEqual(globalThis.window.dataLayer, [["event", "conversion", {
    send_to: "AW-123456789/registered",
    transaction_id: "opaque-event-id",
  }]]);
});

test("a tag exception does not break the account page", () => {
  configure();
  process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION = "AW-123456789/registered";
  globalThis.window = { gtag: () => { throw new Error("blocked"); } };
  assert.equal(trackGoogleAdsRegistration("opaque-event-id"), false);
});
