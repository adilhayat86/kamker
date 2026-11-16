export const RECOVERY_PHRASE_QUESTION = "What is your private recovery phrase?";
export const RECOVERY_PHRASE_MIN_LENGTH = 12;
export const RECOVERY_PHRASE_MAX_LENGTH = 128;

// Match the existing reset flow's comparison rules; never store the plain phrase.
export function normalizeRecoveryPhrase(value: string): string {
  return value.trim().toLowerCase();
}

export function validateRecoveryPhrase(phrase: string, confirmation: string, currentPassword: string): "phrase-length" | "phrase-mismatch" | "phrase-password" | null {
  const normalized = normalizeRecoveryPhrase(phrase);
  if (normalized.length < RECOVERY_PHRASE_MIN_LENGTH || normalized.length > RECOVERY_PHRASE_MAX_LENGTH) return "phrase-length";
  if (normalized !== normalizeRecoveryPhrase(confirmation)) return "phrase-mismatch";
  if (normalized === normalizeRecoveryPhrase(currentPassword)) return "phrase-password";
  return null;
}
