const UUID_SUFFIX_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Builds an SEO-friendly profile URL segment: a readable slug with the
 * record's UUID appended, so the id is always recoverable without a DB
 * lookup keyed on the slug text itself (no migration/backfill needed).
 */
export function buildProfileSlug(name: string, id: string) {
  const base = slugify(name);
  return base ? `${base}-${id}` : id;
}

/**
 * Extracts a UUID id from a profile URL segment. Falls back to returning
 * the raw param when it isn't UUID-shaped (e.g. local demo ids like
 * "mock-nurses"), so non-Supabase/local-dev paths keep working unchanged.
 */
export function extractIdFromSlug(param: string) {
  const match = param.match(UUID_SUFFIX_RE);
  return match ? match[1] : param;
}
