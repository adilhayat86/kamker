export const WORKER_AGE_MIN = 16;
export const WORKER_AGE_MAX = 80;
export const WORKER_HOURLY_RATE_MIN = 50;
export const WORKER_HOURLY_RATE_MAX = 10000;

export const WORKER_AGE_HELPER_TEXT = `Age must be between ${WORKER_AGE_MIN} and ${WORKER_AGE_MAX}.`;
export const WORKER_HOURLY_RATE_HELPER_TEXT = `Enter Rs ${WORKER_HOURLY_RATE_MIN} to Rs ${WORKER_HOURLY_RATE_MAX.toLocaleString(
  "en-PK"
)} per hour. Example: 500.`;

function parseIntegerString(value: string) {
  const normalized = value.replace(/[,\s]/g, "").trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseWorkerAge(value: string) {
  const parsed = parseIntegerString(value);

  if (parsed === null || parsed < WORKER_AGE_MIN || parsed > WORKER_AGE_MAX) {
    return null;
  }

  return parsed;
}

export function parseWorkerHourlyRate(value: string) {
  const parsed = parseIntegerString(value);

  if (
    parsed === null ||
    parsed < WORKER_HOURLY_RATE_MIN ||
    parsed > WORKER_HOURLY_RATE_MAX
  ) {
    return null;
  }

  return parsed;
}
