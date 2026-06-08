import { logJson, productionConfig, supabaseRest } from "./qa-utils.mjs";

const defaultSamples = 3;

async function main() {
  const { baseUrl } = productionConfig();
  const sampleCount = Number(process.env.KAMKER_QA_PERF_SAMPLES ?? defaultSamples);
  const latest = await latestQaRecords();
  const routes = buildRoutes(baseUrl, latest);
  const started = Date.now();
  const results = [];

  for (const route of routes) {
    results.push(await sampleRoute(route, sampleCount));
  }

  const warnings = results.filter((result) => result.warning);

  logJson({
    ok: warnings.length === 0,
    baseUrl,
    sampleCount,
    checkedAt: new Date().toISOString(),
    ms: Date.now() - started,
    summary: summarize(results),
    warnings,
    results,
  });

  if (warnings.length > 0) {
    process.exitCode = 1;
  }
}

async function latestQaRecords() {
  const [workers, companies, staff] = await Promise.all([
    supabaseRest(
      "professionals?select=id&or=(full_name.like.Admin%20Test%20Stress%20Worker*,full_name.like.Admin%20Test%20Worker*)&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "companies?select=id&or=(company_name.like.Admin%20Test%20Stress%20Company*,company_name.like.Admin%20Test%20Company*)&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "company_listings?select=id&or=(title.like.Admin%20Test%20Stress%20Staff*,title.like.Admin%20Test%20Staff*)&order=created_at.desc&limit=1",
    ),
  ]);

  return {
    workerId: workers[0]?.id ?? null,
    companyId: companies[0]?.id ?? null,
    staffId: staff[0]?.id ?? null,
  };
}

function buildRoutes(baseUrl, latest) {
  return [
    {
      area: "homepage",
      name: "home",
      url: `${baseUrl}/`,
      medianWarningMs: 1800,
      p95WarningMs: 3000,
    },
    {
      area: "discovery",
      name: "categories",
      url: `${baseUrl}/categories`,
      medianWarningMs: 1800,
      p95WarningMs: 3000,
    },
    {
      area: "discovery",
      name: "nurses category",
      url: `${baseUrl}/categories/nurses`,
      medianWarningMs: 2200,
      p95WarningMs: 3500,
    },
    {
      area: "discovery",
      name: "professional search",
      url: `${baseUrl}/professionals?q=nurse&city=Karachi&category=Nurses&age=26-35`,
      medianWarningMs: 2500,
      p95WarningMs: 4000,
    },
    {
      area: "registration",
      name: "professional registration",
      url: `${baseUrl}/register/professional`,
      medianWarningMs: 2200,
      p95WarningMs: 3500,
    },
    {
      area: "registration",
      name: "company registration",
      url: `${baseUrl}/register/company`,
      medianWarningMs: 2200,
      p95WarningMs: 3500,
    },
    latest.workerId && {
      area: "profiles",
      name: "worker profile",
      url: `${baseUrl}/professionals/${latest.workerId}`,
      medianWarningMs: 2200,
      p95WarningMs: 3500,
    },
    latest.staffId && {
      area: "profiles",
      name: "company staff profile",
      url: `${baseUrl}/company-listings/${latest.staffId}`,
      medianWarningMs: 2200,
      p95WarningMs: 3500,
    },
    latest.companyId && {
      area: "company",
      name: "company profile",
      url: `${baseUrl}/companies/${latest.companyId}`,
      medianWarningMs: 2500,
      p95WarningMs: 4500,
    },
  ].filter(Boolean);
}

async function sampleRoute(route, sampleCount) {
  const samples = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const started = Date.now();
    const response = await fetch(route.url, { redirect: "follow" });
    await response.arrayBuffer();
    samples.push({
      status: response.status,
      ok: response.ok,
      ms: Date.now() - started,
      finalUrl: response.url,
    });
  }

  const times = samples.map((sample) => sample.ms).sort((a, b) => a - b);
  const median = percentile(times, 0.5);
  const p95 = percentile(times, 0.95);
  const warning = median > route.medianWarningMs || p95 > route.p95WarningMs;

  return {
    area: route.area,
    name: route.name,
    url: route.url,
    ok: samples.every((sample) => sample.ok),
    warning,
    median,
    p95,
    min: times[0],
    max: times[times.length - 1],
    medianWarningMs: route.medianWarningMs,
    p95WarningMs: route.p95WarningMs,
    samples,
  };
}

function percentile(sortedValues, fraction) {
  if (sortedValues.length === 0) {
    return null;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.ceil(sortedValues.length * fraction) - 1,
  );

  return sortedValues[index];
}

function summarize(results) {
  return results.reduce((accumulator, result) => {
    const current = accumulator[result.area] ?? {
      routes: 0,
      warnings: 0,
      slowestMedian: 0,
      slowestP95: 0,
    };

    current.routes += 1;
    current.warnings += result.warning ? 1 : 0;
    current.slowestMedian = Math.max(current.slowestMedian, result.median ?? 0);
    current.slowestP95 = Math.max(current.slowestP95, result.p95 ?? 0);
    accumulator[result.area] = current;
    return accumulator;
  }, {});
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
