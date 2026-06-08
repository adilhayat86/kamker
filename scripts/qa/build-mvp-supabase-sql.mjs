import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputPath = path.join(root, "tmp", "kamker-mvp-production.sql");
const helperPath = path.join(root, "tmp", "kamker-mvp-production.html");
const shouldCopy = process.argv.includes("--copy");
const phoneOnly = process.argv.includes("--phone-only");

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
const selectedMigrationFiles = phoneOnly
  ? ["sql/20260608_phone_ownership_rules.sql"]
  : migrationFiles;

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
  const missing = selectedMigrationFiles.filter((file) => !fs.existsSync(path.join(root, file)));

  if (missing.length > 0) {
    throw new Error(`Missing SQL files: ${missing.join(", ")}`);
  }

  const content = [
    "-- Kamker MVP production Supabase SQL bundle.",
    "-- Generated from committed SQL files. Do not paste secrets here.",
    `-- Generated at: ${new Date().toISOString()}`,
    "-- Run this in Supabase SQL Editor for the Kamker project.",
    "",
    ...selectedMigrationFiles.flatMap((file) => [
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
  fs.writeFileSync(
    helperPath,
    buildHtmlHelper({
      content,
      phoneOnly,
      supabaseProjectUrl: "https://supabase.com/dashboard/project/hjttoxgryzyxhcdepgcg/sql/new",
    }),
    "utf8",
  );

  const copiedToClipboard = shouldCopy ? copyToClipboard(content) : false;

  console.log(JSON.stringify({
    ok: true,
    outputPath,
    helperPath,
    files: selectedMigrationFiles,
    bytes: Buffer.byteLength(content, "utf8"),
    copiedToClipboard,
    nextStep: copiedToClipboard
      ? "Paste into Supabase SQL Editor, run it, then npm run qa:mvp-readiness. If paste is unreliable, open tmp/kamker-mvp-production.html and use its Copy SQL button."
      : "Open tmp/kamker-mvp-production.html, use Copy SQL, paste into Supabase SQL Editor, run it, then npm run qa:mvp-readiness.",
  }, null, 2));
}

function buildHtmlHelper({ content, phoneOnly, supabaseProjectUrl }) {
  const escapedSql = escapeHtml(content);
  const title = phoneOnly
    ? "Kamker phone ownership migration"
    : "Kamker MVP production migration";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, sans-serif;
        background: #f4f9ff;
        color: #0f172a;
      }

      body {
        margin: 0;
        padding: 24px;
      }

      main {
        max-width: 980px;
        margin: 0 auto;
        display: grid;
        gap: 16px;
      }

      .panel {
        border: 1px solid #c9e2f5;
        border-radius: 12px;
        background: white;
        box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
        padding: 18px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 24px;
      }

      p,
      li {
        line-height: 1.55;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      button,
      a.button {
        border: 0;
        border-radius: 10px;
        background: #0876c9;
        color: white;
        cursor: pointer;
        display: inline-flex;
        font-size: 15px;
        font-weight: 700;
        justify-content: center;
        padding: 12px 16px;
        text-decoration: none;
      }

      button.secondary,
      a.secondary {
        background: #e8f3ff;
        color: #075985;
      }

      textarea {
        box-sizing: border-box;
        border: 1px solid #b6d7ef;
        border-radius: 10px;
        font-family: Consolas, "Courier New", monospace;
        font-size: 13px;
        min-height: 420px;
        padding: 14px;
        width: 100%;
      }

      .status {
        color: #166534;
        font-weight: 700;
        min-height: 24px;
      }

      code {
        background: #eef6ff;
        border-radius: 6px;
        padding: 2px 6px;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="panel">
        <h1>${title}</h1>
        <p>
          This page contains generated SQL only. It does not contain secrets.
          Use it when the embedded browser clipboard refuses to paste into Supabase.
        </p>
        <ol>
          <li>Click <strong>Copy SQL</strong>. If the browser blocks that, click <strong>Select SQL</strong> and press <code>Ctrl+C</code>.</li>
          <li>Open the Supabase SQL Editor.</li>
          <li>Paste the SQL, click <strong>Run</strong>, then return to Codex.</li>
          <li>Run <code>npm run qa:mvp-readiness</code>.</li>
        </ol>
        <div class="actions">
          <button type="button" id="copy">Copy SQL</button>
          <button type="button" class="secondary" id="select">Select SQL</button>
          <a class="button secondary" href="${supabaseProjectUrl}" target="_blank" rel="noreferrer">Open Supabase SQL Editor</a>
        </div>
        <p class="status" id="status"></p>
      </section>
      <section class="panel">
        <textarea id="sql" spellcheck="false">${escapedSql}</textarea>
      </section>
    </main>
    <script>
      const textarea = document.getElementById("sql");
      const status = document.getElementById("status");

      document.getElementById("select").addEventListener("click", () => {
        textarea.focus();
        textarea.select();
        status.textContent = "SQL selected. Press Ctrl+C if Copy SQL did not work.";
      });

      document.getElementById("copy").addEventListener("click", async () => {
        textarea.focus();
        textarea.select();

        try {
          await navigator.clipboard.writeText(textarea.value);
          status.textContent = "SQL copied. Paste it into Supabase SQL Editor and click Run.";
        } catch {
          status.textContent = "Clipboard was blocked. SQL is selected now; press Ctrl+C.";
        }
      });
    </script>
  </body>
</html>
`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
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
