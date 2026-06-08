import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputPath = path.join(root, "tmp", "kamker-mvp-production.sql");
const shouldCopy = process.argv.includes("--copy");

const migrationFiles = [
  "schema.sql",
  "sql/20260604_company_professional_listings.sql",
  "sql/20260604_photos_and_analytics.sql",
  "sql/20260604_proof_reviews.sql",
  "sql/20260604_whatsapp_messages.sql",
  "sql/20260604_worker_availability.sql",
  "sql/20260605_company_profiles_media.sql",
  "sql/20260606_professional_photo_limit.sql",
  "sql/20260606_worker_age.sql",
  "sql/20260607_admin_audit_logs.sql",
  "sql/20260607_admin_passwords.sql",
  "sql/20260607_company_staff_requirement_matches.sql",
  "sql/20260607_disable_mvp_rls.sql",
  "sql/20260607_storage_upload_limits.sql",
  "sql/20260608_canonical_categories.sql",
  "sql/20260608_phone_ownership_rules.sql",
  "sql/20260608_public_browse_performance.sql",
];

const verificationSql = String.raw`
-- ---------------------------------------------------------------------------
-- Kamker MVP verification. The final row should show missing_tables = none.
-- ---------------------------------------------------------------------------
with expected(name) as (
  values
    ('professionals'),('customers'),('requirements'),('requirement_matches'),
    ('companies'),('company_packages'),('manual_payments'),('company_package_subscriptions'),
    ('company_listings'),('proof_reviews'),('analytics_events'),('whatsapp_messages'),
    ('admin_audit_logs'),('categories'),('cities'),('company_media'),('admin_settings'),
    ('professional_sessions'),('admin_passwords'),('admin_password_resets')
), found as (
  select table_name::text as name
  from information_schema.tables
  where table_schema = 'public'
)
select
  count(*) filter (where found.name is not null) as found_count,
  coalesce(
    string_agg(expected.name, ', ' order by expected.name)
      filter (where found.name is null),
    'none'
  ) as missing_tables
from expected
left join found using (name);

-- Required app-facing columns. The final row should show missing_columns = none.
with expected(table_name, column_name) as (
  values
    ('professionals', 'phone_normalized'),
    ('professionals', 'profile_photo_url'),
    ('professionals', 'tagline'),
    ('professionals', 'age'),
    ('professionals', 'password_hash'),
    ('professionals', 'secret_question'),
    ('professionals', 'secret_answer_hash'),
    ('company_listings', 'service_group'),
    ('company_listings', 'profile_photo_url'),
    ('company_listings', 'tagline'),
    ('company_listings', 'age'),
    ('companies', 'logo_url'),
    ('requirements', 'broadcast_status'),
    ('requirements', 'payment_status'),
    ('proof_reviews', 'ai_decision'),
    ('admin_passwords', 'password_hash')
), found as (
  select table_name::text, column_name::text
  from information_schema.columns
  where table_schema = 'public'
)
select
  count(*) filter (where found.column_name is not null) as found_count,
  coalesce(
    string_agg(expected.table_name || '.' || expected.column_name, ', ' order by expected.table_name, expected.column_name)
      filter (where found.column_name is null),
    'none'
  ) as missing_columns
from expected
left join found using (table_name, column_name);

-- Required public performance and ownership indexes.
select
  coalesce(
    string_agg(index_name, ', ' order by index_name),
    'none'
  ) as missing_indexes
from (
  values
    ('professionals_phone_normalized_unique_idx'),
    ('professionals_public_browse_idx'),
    ('professionals_public_availability_idx'),
    ('company_listings_public_browse_idx'),
    ('company_listings_public_group_idx')
) as expected(index_name)
where not exists (
  select 1
  from pg_indexes
  where schemaname = 'public'
    and indexname = expected.index_name
);

-- Storage bucket readiness. company-images must allow images and video.
select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id in ('professional-photos', 'proof-images', 'company-images')
order by id;
`;

function main() {
  const missing = migrationFiles.filter((file) => !fs.existsSync(path.join(root, file)));

  if (missing.length > 0) {
    throw new Error(`Missing SQL files: ${missing.join(", ")}`);
  }

  const content = [
    "-- Kamker MVP production Supabase SQL bundle.",
    "-- Generated from committed SQL files. Do not paste secrets here.",
    `-- Generated at: ${new Date().toISOString()}`,
    "-- Run this in Supabase SQL Editor for the Kamker project.",
    "",
    ...migrationFiles.flatMap((file) => [
      "",
      "-- ---------------------------------------------------------------------------",
      `-- ${file}`,
      "-- ---------------------------------------------------------------------------",
      fs.readFileSync(path.join(root, file), "utf8").trim(),
      "",
    ]),
    verificationSql.trim(),
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");

  const copiedToClipboard = shouldCopy ? copyToClipboard(content) : false;

  console.log(JSON.stringify({
    ok: true,
    outputPath,
    files: migrationFiles,
    bytes: Buffer.byteLength(content, "utf8"),
    copiedToClipboard,
    nextStep: copiedToClipboard
      ? "Paste into Supabase SQL Editor, run it, then npm run qa:mvp-readiness."
      : "Open tmp/kamker-mvp-production.sql, paste it into Supabase SQL Editor, run it, then npm run qa:mvp-readiness.",
  }, null, 2));
}

function copyToClipboard(content) {
  const command =
    process.platform === "win32"
      ? "clip"
      : process.platform === "darwin"
        ? "pbcopy"
        : "xclip";
  const args = process.platform === "linux" ? ["-selection", "clipboard"] : [];
  const result = spawnSync(command, args, {
    input: content,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const reason = result.stderr?.trim() || result.error?.message || "unknown clipboard error";
    throw new Error(`Could not copy SQL bundle to clipboard: ${reason}`);
  }

  return true;
}

main();
