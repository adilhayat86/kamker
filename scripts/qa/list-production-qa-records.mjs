import { logJson, supabaseExactCount, supabaseRest } from "./qa-utils.mjs";

const limit = Number(process.env.KAMKER_QA_LIST_LIMIT ?? 8);

const queries = [
  {
    name: "professionals",
    path: `professionals?select=id,full_name,created_at&full_name=like.Admin%20Test*&order=created_at.desc&limit=${limit}`,
    countPath:
      "professionals?select=id&full_name=like.Admin%20Test*",
  },
  {
    name: "companies",
    path: `companies?select=id,company_name,created_at&company_name=like.Admin%20Test*&order=created_at.desc&limit=${limit}`,
    countPath:
      "companies?select=id&company_name=like.Admin%20Test*",
  },
  {
    name: "company_listings",
    path: `company_listings?select=id,title,company_id,created_at&title=like.Admin%20Test*&order=created_at.desc&limit=${limit}`,
    countPath:
      "company_listings?select=id&title=like.Admin%20Test*",
  },
  {
    name: "requirements",
    path: `requirements?select=id,details,created_at&details=like.Admin%20Test*&order=created_at.desc&limit=${limit}`,
    countPath:
      "requirements?select=id&details=like.Admin%20Test*",
  },
];

async function main() {
  const result = {};
  const counts = {};

  for (const query of queries) {
    const [rows, countRows] = await Promise.all([
      supabaseRest(query.path),
      supabaseExactCount(query.name, query.countPath.split("?")[1]?.replace(/^select=id&/, "") ?? ""),
    ]);
    result[query.name] = rows;
    counts[query.name] = countRows;
  }

  logJson({
    ok: true,
    note: `Showing latest ${limit} records per resource. Set KAMKER_QA_LIST_LIMIT to change this.`,
    counts,
    latestRecords: result,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
