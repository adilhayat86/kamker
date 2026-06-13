import { logJson, supabaseRest } from "./qa-utils.mjs";

const runId = process.env.KAMKER_QA_STRESS_RUN_ID;

function requireRunId() {
  if (!runId || runId.length < 6) {
    throw new Error(
      "Set KAMKER_QA_STRESS_RUN_ID to the stress run id you want to delete. This prevents broad accidental cleanup.",
    );
  }
}

async function deleteByFilter(table, filter, label) {
  const rows = await supabaseRest(`${table}?select=id&${filter}`);

  if (rows.length === 0) {
    return { label, deleted: 0 };
  }

  for (const row of rows) {
    await supabaseRest(`${table}?id=eq.${row.id}`, { method: "DELETE" });
  }

  return { label, deleted: rows.length };
}

async function main() {
  requireRunId();

  const results = [];

  results.push(
    await deleteByFilter(
      "company_listings",
      `title=like.Admin%20Test%20Stress%20Staff*${runId}*`,
      "company_listings",
    ),
  );
  results.push(
    await deleteByFilter(
      "professionals",
      `full_name=like.Admin%20Test%20Stress%20Worker*${runId}*`,
      "professionals",
    ),
  );
  results.push(
    await deleteByFilter(
      "company_package_subscriptions",
      `company_id=in.(${(
        await supabaseRest(
          `companies?select=id&company_name=like.Admin%20Test%20Stress%20Company*${runId}*`,
        )
      )
        .map((company) => company.id)
        .join(",")})`,
      "company_package_subscriptions",
    ).catch(() => ({ label: "company_package_subscriptions", deleted: 0 })),
  );
  results.push(
    await deleteByFilter(
      "companies",
      `company_name=like.Admin%20Test%20Stress%20Company*${runId}*`,
      "companies",
    ),
  );

  logJson({ ok: true, runId, results });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
