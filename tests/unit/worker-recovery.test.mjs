import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeRecoveryPhrase, validateRecoveryPhrase } from "../../src/lib/worker-recovery.ts";

test("recovery phrases follow the existing case-insensitive, trimmed reset comparison", () => {
  assert.equal(normalizeRecoveryPhrase("  Several Private Words  "), "several private words");
  assert.equal(validateRecoveryPhrase("  Several Private Words  ", "several PRIVATE words", "different-password"), null);
});

test("rejects short, oversized, mismatched and reused-password recovery phrases", () => {
  assert.equal(validateRecoveryPhrase("blue", "blue", "password"), "phrase-length");
  assert.equal(validateRecoveryPhrase("a".repeat(129), "a".repeat(129), "password"), "phrase-length");
  assert.equal(validateRecoveryPhrase("several private words", "different private words", "password"), "phrase-mismatch");
  assert.equal(validateRecoveryPhrase("several private words", "several private words", "SEVERAL PRIVATE WORDS"), "phrase-password");
  assert.equal(validateRecoveryPhrase("a".repeat(12), "a".repeat(12), "password"), null);
  assert.equal(validateRecoveryPhrase("a".repeat(128), "a".repeat(128), "password"), null);
});
