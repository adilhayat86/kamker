import { logJson, productionConfig, supabaseRest } from "./qa-utils.mjs";

const suffix = getSuffix();

async function main() {
  const { baseUrl } = productionConfig();
  const records = await findRecords();
  const dataChecks = buildDataChecks(records);
  const routeChecks = await checkRoutes(baseUrl, records);
  const results = [...dataChecks, ...routeChecks];
  const failures = results.filter((result) => !result.ok);

  logJson({
    ok: failures.length === 0,
    baseUrl,
    suffix,
    checkedAt: new Date().toISOString(),
    records,
    failures,
    results,
    nextStep:
      failures.length === 0
        ? "Live QA records exist and public routes render. Continue with admin action QA for these Admin Test records."
        : "Complete the missing visible browser flow or inspect the failed route/table, then rerun this command.",
  });

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

function getSuffix() {
  const fromEnv = process.env.KAMKER_QA_RUN_SUFFIX;
  const fromArg = process.argv.find((arg) => arg.startsWith("--suffix="))?.split("=")[1];
  const value = fromArg || fromEnv;

  if (!value || !/^\d{4,}$/.test(value)) {
    throw new Error(
      "Set KAMKER_QA_RUN_SUFFIX to the numeric suffix from npm run qa:live-test-data, or pass --suffix=1234567.",
    );
  }

  return value;
}

async function findRecords() {
  const [workers, customers, requirements, companies, staff] = await Promise.all([
    supabaseRest(
      `professionals?select=id,full_name,phone_number,city_id,category_id,is_active&full_name=like.*${suffix}*&limit=5`,
    ),
    supabaseRest(
      `customers?select=id,full_name,phone_number,city_id&full_name=like.*${suffix}*&limit=5`,
    ),
    supabaseRest(
      `requirements?select=id,details,required_service,city_id,status&details=like.*${suffix}*&limit=5`,
    ),
    supabaseRest(
      `companies?select=id,company_name,phone,city&company_name=like.*${suffix}*&limit=5`,
    ),
    supabaseRest(
      `company_listings?select=id,title,company_id,category,city,status,is_featured&title=like.*${suffix}*&limit=10`,
    ),
  ]);

  const requirementIds = requirements.map((requirement) => requirement.id);
  const requirementMatches = requirementIds.length
    ? await supabaseRest(
        `requirement_matches?select=id,requirement_id,professional_id,company_listing_id,match_score&requirement_id=in.(${requirementIds.join(",")})`,
      )
    : [];

  return {
    workers,
    customers,
    requirements,
    requirementMatches,
    companies,
    staff,
  };
}

function buildDataChecks(records) {
  return [
    {
      area: "worker",
      name: "worker row created",
      ok: records.workers.length > 0,
      count: records.workers.length,
    },
    {
      area: "customer",
      name: "customer row created",
      ok: records.customers.length > 0,
      count: records.customers.length,
    },
    {
      area: "requirement",
      name: "requirement row created",
      ok: records.requirements.length > 0,
      count: records.requirements.length,
    },
    {
      area: "requirement",
      name: "requirement matches created",
      ok: records.requirements.length > 0 && records.requirementMatches.length > 0,
      count: records.requirementMatches.length,
    },
    {
      area: "company",
      name: "company row created",
      ok: records.companies.length > 0,
      count: records.companies.length,
    },
    {
      area: "company staff",
      name: "company staff row created",
      ok: records.staff.length > 0,
      count: records.staff.length,
    },
  ];
}

async function checkRoutes(baseUrl, records) {
  const checks = [
    records.workers[0] && {
      area: "worker",
      name: "worker public profile renders",
      url: `${baseUrl}/professionals/${records.workers[0].id}`,
      terms: [suffix, "Call", "WhatsApp"],
    },
    records.workers[0] && {
      area: "search",
      name: "worker appears in search",
      url: `${baseUrl}/professionals?q=${encodeURIComponent(suffix)}`,
      terms: [suffix],
    },
    records.companies[0] && {
      area: "company",
      name: "company public profile renders",
      url: `${baseUrl}/companies/${records.companies[0].id}`,
      terms: [suffix, "Company"],
    },
    records.staff[0] && {
      area: "company staff",
      name: "company staff public profile renders",
      url: `${baseUrl}/company-listings/${records.staff[0].id}`,
      terms: [suffix, "Company Profile"],
    },
  ].filter(Boolean);

  const results = [];
  for (const check of checks) {
    results.push(await checkRoute(check));
  }

  return results;
}

async function checkRoute(check) {
  const started = Date.now();
  const response = await fetch(check.url, { redirect: "follow" });
  const body = await response.text();
  const found = Object.fromEntries(
    check.terms.map((term) => [term, body.toLowerCase().includes(term.toLowerCase())]),
  );

  return {
    area: check.area,
    name: check.name,
    ok: response.ok && Object.values(found).every(Boolean),
    status: response.status,
    ms: Date.now() - started,
    url: check.url,
    finalUrl: response.url,
    found,
  };
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
