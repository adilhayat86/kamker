import { logJson } from "./qa-utils.mjs";
import { safeDeleteByIds, safeRows } from "./sample-data-utils.mjs";

const confirmText = "RESET_MARKETPLACE_CONTENT";
const shouldExecute = process.env.KAMKER_MARKETPLACE_RESET_CONFIRM === confirmText;

const resetTables = [
  "whatsapp_messages",
  "proof_reviews",
  "requirement_notifications",
  "requirement_matches",
  "requirement_broadcast_payments",
  "professional_sessions",
  "customer_sessions",
  "company_media",
  "manual_payments",
  "company_package_subscriptions",
  "company_listings",
  "requirements",
  "customers",
  "professionals",
  "companies",
  "analytics_events",
];

async function main() {
  const tableRows = {};
  for (const table of resetTables) {
    tableRows[table] = await safeRows(`${table}?select=id`);
  }

  const results = [];
  for (const table of resetTables) {
    results.push(await safeDeleteByIds(table, tableRows[table], shouldExecute));
  }

  logJson({
    ok: true,
    mode: shouldExecute ? "execute" : "dry-run",
    safety: shouldExecute
      ? "Marketplace content reset completed. Admin/settings/categories/cities/packages were preserved."
      : `Dry run only. Set KAMKER_MARKETPLACE_RESET_CONFIRM=${confirmText} to execute.`,
    preserved: [
      "admin_passwords",
      "admin_settings",
      "admin_audit_logs",
      "categories",
      "cities",
      "company_packages",
      "storage buckets",
      "schema",
    ],
    counts: Object.fromEntries(
      Object.entries(tableRows).map(([table, rows]) => [table, rows.length]),
    ),
    results,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
