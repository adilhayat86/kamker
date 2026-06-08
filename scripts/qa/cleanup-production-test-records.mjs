import { logJson, supabaseRest, supabaseRestAll } from "./qa-utils.mjs";

const confirmText = "DELETE_ADMIN_TEST_RECORDS";
const shouldExecute = process.env.KAMKER_QA_CLEANUP_CONFIRM === confirmText;

const testLike = "Admin%20Test*";

async function main() {
  const testRecords = await collectTestRecords();
  const plan = buildCleanupPlan(testRecords);
  const results = [];

  for (const item of plan) {
    results.push(await processPlanItem(item));
  }

  logJson({
    ok: true,
    mode: shouldExecute ? "execute" : "dry-run",
    safety:
      shouldExecute
        ? "Deleted only rows matched by Admin Test names/descriptions or rows linked to those records."
        : `Dry run only. Set KAMKER_QA_CLEANUP_CONFIRM=${confirmText} to execute.`,
    counts: Object.fromEntries(
      Object.entries(testRecords).map(([key, value]) => [key, value.length]),
    ),
    results,
  });
}

async function collectTestRecords() {
  const [professionals, customers, requirements, companies, companyListings, categories, cities] =
    await Promise.all([
      safeRows("professionals?select=id,full_name&full_name=like." + testLike),
      safeRows("customers?select=id,full_name&full_name=like." + testLike),
      safeRows("requirements?select=id,details&details=like." + testLike),
      safeRows("companies?select=id,company_name&company_name=like." + testLike),
      safeRows("company_listings?select=id,title,company_id&title=like." + testLike),
      safeRows("categories?select=id,name&name=like." + testLike),
      safeRows("cities?select=id,name&name=like." + testLike),
    ]);

  const professionalIds = professionals.map((row) => row.id);
  const requirementIds = requirements.map((row) => row.id);
  const companyIds = companies.map((row) => row.id);
  const companyListingIds = companyListings.map((row) => row.id);

  const [manualPayments, proofReviews, requirementMatches, requirementNotifications] =
    await Promise.all([
      rowsByAnyFilter("manual_payments", ["company_id"], companyIds),
      collectProofReviews({ professionalIds, manualPaymentIds: [] }),
      rowsByAnyFilter("requirement_matches", ["requirement_id"], requirementIds),
      rowsByAnyFilter("requirement_notifications", ["requirement_id"], requirementIds),
    ]);

  const linkedManualPayments = [
    ...manualPayments,
    ...(await safeRows("manual_payments?select=id,company_id,payer_name&payer_name=like." + testLike)),
  ];
  const manualPaymentIds = uniqueIds(linkedManualPayments);
  const linkedProofReviews = [
    ...proofReviews,
    ...(await collectProofReviews({ professionalIds, manualPaymentIds })),
    ...(await safeRows("proof_reviews?select=id,review_type,related_id&ai_notes=like." + testLike)),
  ];

  return {
    professionals,
    customers,
    requirements,
    companies,
    companyListings,
    categories,
    cities,
    manualPayments: uniqueRows(linkedManualPayments),
    proofReviews: uniqueRows(linkedProofReviews),
    requirementMatches: uniqueRows([
      ...requirementMatches,
      ...(await rowsByAnyFilter("requirement_matches", ["professional_id"], professionalIds)),
      ...(await rowsByAnyFilter("requirement_matches", ["company_listing_id"], companyListingIds)),
    ]),
    requirementNotifications: uniqueRows([
      ...requirementNotifications,
      ...(await rowsByAnyFilter("requirement_notifications", ["professional_id"], professionalIds)),
    ]),
    professionalSessions: await rowsByAnyFilter("professional_sessions", ["professional_id"], professionalIds),
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

function buildCleanupPlan(records) {
  return [
    { table: "whatsapp_messages", rows: records.whatsappMessages },
    { table: "proof_reviews", rows: records.proofReviews },
    { table: "requirement_notifications", rows: records.requirementNotifications },
    { table: "requirement_matches", rows: records.requirementMatches },
    { table: "professional_sessions", rows: records.professionalSessions },
    { table: "company_media", rows: records.companyMedia },
    { table: "manual_payments", rows: records.manualPayments },
    { table: "company_package_subscriptions", rows: records.companySubscriptions },
    { table: "company_listings", rows: records.companyListings },
    { table: "requirements", rows: records.requirements },
    { table: "customers", rows: records.customers },
    { table: "professionals", rows: records.professionals },
    { table: "companies", rows: records.companies },
    { table: "categories", rows: records.categories },
    { table: "cities", rows: records.cities },
  ];
}

async function processPlanItem(item) {
  const rows = uniqueRows(item.rows);

  if (!shouldExecute) {
    return { table: item.table, matched: rows.length, deleted: 0 };
  }

  let deleted = 0;
  for (const chunk of chunks(rows.map((row) => row.id), 80)) {
    await supabaseRest(`${item.table}?id=in.(${chunk.join(",")})`, {
      method: "DELETE",
    });
    deleted += chunk.length;
  }

  return { table: item.table, matched: rows.length, deleted };
}

async function collectProofReviews({ professionalIds, manualPaymentIds }) {
  return uniqueRows([
    ...(await rowsByAnyFilter("proof_reviews", ["related_id"], professionalIds)),
    ...(await rowsByAnyFilter("proof_reviews", ["related_id"], manualPaymentIds)),
  ]);
}

async function rowsByAnyFilter(table, columns, ids) {
  if (!ids.length) {
    return [];
  }

  const results = [];
  for (const column of columns) {
    for (const chunk of chunks(ids, 80)) {
      results.push(...(await safeRows(`${table}?select=id&${column}=in.(${chunk.join(",")})`)));
    }
  }

  return uniqueRows(results);
}

async function safeRows(path) {
  try {
    return await supabaseRestAll(path);
  } catch {
    return [];
  }
}

function uniqueRows(rows) {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

function uniqueIds(rows) {
  return uniqueRows(rows).map((row) => row.id);
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }

  return result;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
