import { logJson } from "./qa-utils.mjs";
import {
  rowsByAnyFilter,
  safeDeleteByIds,
  safeRows,
  sampleLike,
  uniqueRows,
} from "./sample-data-utils.mjs";

const confirmText = "DELETE_SAMPLE_DATA";
const shouldExecute = process.env.KAMKER_SAMPLE_CLEANUP_CONFIRM === confirmText;

async function main() {
  const records = await collectSampleRecords();
  const plan = cleanupPlan(records);
  const results = [];

  for (const item of plan) {
    results.push(await safeDeleteByIds(item.table, item.rows, shouldExecute));
  }

  logJson({
    ok: true,
    mode: shouldExecute ? "execute" : "dry-run",
    safety: shouldExecute
      ? "Deleted only rows matched by Sample Data prefixes or linked to those rows."
      : `Dry run only. Set KAMKER_SAMPLE_CLEANUP_CONFIRM=${confirmText} to execute.`,
    counts: Object.fromEntries(
      Object.entries(records).map(([key, value]) => [key, value.length]),
    ),
    results,
  });
}

async function collectSampleRecords() {
  const [professionals, customers, requirements, companies, companyListings] =
    await Promise.all([
      safeRows(`professionals?select=id,full_name&full_name=like.${sampleLike}`),
      safeRows(`customers?select=id,full_name&full_name=like.${sampleLike}`),
      safeRows(`requirements?select=id,details&details=like.${sampleLike}`),
      safeRows(`companies?select=id,company_name&company_name=like.${sampleLike}`),
      safeRows(`company_listings?select=id,title,company_id&title=like.${sampleLike}`),
    ]);

  const professionalIds = professionals.map((row) => row.id);
  const customerIds = customers.map((row) => row.id);
  const requirementIds = requirements.map((row) => row.id);
  const companyIds = companies.map((row) => row.id);
  const companyListingIds = companyListings.map((row) => row.id);
  const manualPayments = uniqueRows([
    ...(await rowsByAnyFilter("manual_payments", ["company_id"], companyIds)),
    ...(await rowsByAnyFilter("manual_payments", ["requirement_id"], requirementIds)),
  ]);
  const manualPaymentIds = manualPayments.map((row) => row.id);

  return {
    professionals,
    customers,
    requirements,
    companies,
    companyListings,
    manualPayments,
    proofReviews: uniqueRows([
      ...(await rowsByAnyFilter("proof_reviews", ["related_id"], [
        ...professionalIds,
        ...manualPaymentIds,
        ...requirementIds,
      ])),
    ]),
    requirementMatches: uniqueRows([
      ...(await rowsByAnyFilter("requirement_matches", ["requirement_id"], requirementIds)),
      ...(await rowsByAnyFilter("requirement_matches", ["professional_id"], professionalIds)),
      ...(await rowsByAnyFilter("requirement_matches", ["company_listing_id"], companyListingIds)),
    ]),
    requirementNotifications: uniqueRows([
      ...(await rowsByAnyFilter("requirement_notifications", ["requirement_id"], requirementIds)),
      ...(await rowsByAnyFilter("requirement_notifications", ["professional_id"], professionalIds)),
    ]),
    professionalSessions: await rowsByAnyFilter(
      "professional_sessions",
      ["professional_id"],
      professionalIds,
    ),
    customerSessions: await rowsByAnyFilter("customer_sessions", ["customer_id"], customerIds),
    companySubscriptions: await rowsByAnyFilter(
      "company_package_subscriptions",
      ["company_id"],
      companyIds,
    ),
    companyMedia: await rowsByAnyFilter("company_media", ["company_id"], companyIds),
    whatsappMessages: uniqueRows([
      ...(await rowsByAnyFilter("whatsapp_messages", ["related_id"], requirementIds)),
      ...(await rowsByAnyFilter("whatsapp_messages", ["related_id"], companyIds)),
      ...(await rowsByAnyFilter("whatsapp_messages", ["related_id"], manualPaymentIds)),
    ]),
  };
}

function cleanupPlan(records) {
  return [
    { table: "whatsapp_messages", rows: records.whatsappMessages },
    { table: "proof_reviews", rows: records.proofReviews },
    { table: "requirement_notifications", rows: records.requirementNotifications },
    { table: "requirement_matches", rows: records.requirementMatches },
    { table: "professional_sessions", rows: records.professionalSessions },
    { table: "customer_sessions", rows: records.customerSessions },
    { table: "company_media", rows: records.companyMedia },
    { table: "manual_payments", rows: records.manualPayments },
    { table: "company_package_subscriptions", rows: records.companySubscriptions },
    { table: "company_listings", rows: records.companyListings },
    { table: "requirements", rows: records.requirements },
    { table: "customers", rows: records.customers },
    { table: "professionals", rows: records.professionals },
    { table: "companies", rows: records.companies },
  ];
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
