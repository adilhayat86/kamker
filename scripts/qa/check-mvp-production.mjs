import { logJson, productionConfig, supabaseRest } from "./qa-utils.mjs";

const forbiddenTerms = ["Post a Job", "Post Job", "Post a job"];

async function main() {
  const { baseUrl } = productionConfig();
  const latest = await latestQaRecords();
  const checks = mvpRouteChecks(baseUrl, latest);
  const results = [];

  for (const check of checks) {
    results.push(await checkRoute(check));
  }

  const qaData = await checkQaDataCounts();
  const ok = results.every((result) => result.ok) && qaData.ok;

  logJson({
    ok,
    baseUrl,
    latest,
    qaData,
    summary: summarize(results),
    failures: results.filter((result) => !result.ok),
    warnings: results.filter((result) => result.warning),
    results,
  });

  if (!ok) {
    process.exitCode = 1;
  }
}

async function latestQaRecords() {
  const [workers, requirements, companies, staff] = await Promise.all([
    supabaseRest(
      "professionals?select=id,full_name&or=(full_name.like.Admin%20Test%20Stress%20Worker*,full_name.like.Admin%20Test%20Worker*)&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "requirements?select=id,details&details=like.Admin%20Test%20Requirement*&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "companies?select=id,company_name&or=(company_name.like.Admin%20Test%20Stress%20Company*,company_name.like.Admin%20Test%20Company*)&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "company_listings?select=id,title,company_id&or=(title.like.Admin%20Test%20Stress%20Staff*,title.like.Admin%20Test%20Staff*)&order=created_at.desc&limit=1",
    ),
  ]);

  return {
    worker: workers[0] ?? null,
    requirement: requirements[0] ?? null,
    company: companies[0] ?? null,
    staff: staff[0] ?? null,
  };
}

function mvpRouteChecks(baseUrl, latest) {
  const workerId = latest.worker?.id;
  const companyId = latest.company?.id;
  const staffId = latest.staff?.id;
  const requirementId = latest.requirement?.id;

  return [
    {
      area: "homepage",
      name: "homepage action hierarchy",
      url: `${baseUrl}/`,
      required: ["Find part time workers", "Register", "Categories"],
      forbidden: [...forbiddenTerms, "50,000+", "120+", "25+"],
      maxMsWarning: 2500,
    },
    {
      area: "public discovery",
      name: "categories index",
      url: `${baseUrl}/categories`,
      required: ["Healthcare", "Domestic Help", "Transport"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "public discovery",
      name: "nurses category",
      url: `${baseUrl}/categories/nurses`,
      required: ["Nurses", "Admin Test", "Worker Profile"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "public discovery",
      name: "advanced professional search",
      url: `${baseUrl}/professionals?q=nurse&city=Karachi&category=Nurses&age=26-35`,
      required: ["Nurses", "Admin Test", "Worker Profile"],
      forbidden: forbiddenTerms,
      maxMsWarning: 3500,
    },
    {
      area: "registration",
      name: "register chooser",
      url: `${baseUrl}/register`,
      required: ["Professional", "Company", "Customer"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "registration",
      name: "professional registration",
      url: `${baseUrl}/register/professional`,
      required: ["Profile photo", "Full name", "WhatsApp number", "Profile Tagline"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "registration",
      name: "company registration",
      url: `${baseUrl}/register/company`,
      required: ["Company", "multiple", "professionals"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "registration",
      name: "customer registration",
      url: `${baseUrl}/register/customer`,
      required: ["Customer", "Full name", "Phone number"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "requirements",
      name: "send requirement public form",
      url: `${baseUrl}/send-requirement?category=Nurses&city=Lahore`,
      required: ["Send Requirement", "Required service", "Urgency"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "payments",
      name: "proof upload",
      url: `${baseUrl}/proof-upload`,
      required: ["proof", "Upload"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    workerId && {
      area: "worker profile",
      name: "individual worker profile",
      url: `${baseUrl}/professionals/${workerId}`,
      required: ["Admin Test", "Call", "WhatsApp", "Age"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    staffId && {
      area: "company staff",
      name: "company-managed worker profile",
      url: `${baseUrl}/company-listings/${staffId}`,
      required: ["Admin Test", "Company Profile", "Call", "WhatsApp"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    companyId && {
      area: "company",
      name: "company public profile",
      url: `${baseUrl}/companies/${companyId}`,
      required: ["Admin Test", "Company", "Staff"],
      forbidden: forbiddenTerms,
      maxMsWarning: 3000,
    },
    companyId && {
      area: "company",
      name: "company package selection",
      url: `${baseUrl}/companies/${companyId}/packages`,
      required: ["Package", "listings", "featured"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    companyId && {
      area: "company",
      name: "company payment proof",
      url: `${baseUrl}/companies/${companyId}/payment?package=company_enterprise_monthly`,
      required: ["receipt", "Package", "AI"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    companyId && {
      area: "company",
      name: "company dashboard",
      url: `${baseUrl}/companies/${companyId}/dashboard`,
      required: ["Admin Test", "Staff", "Dashboard"],
      forbidden: forbiddenTerms,
      maxMsWarning: 2500,
    },
    {
      area: "admin protection",
      name: "admin dashboard protected",
      url: `${baseUrl}/admin`,
      required: ["Admin Login"],
      forbidden: ["System Health | Kamker Admin"],
      maxMsWarning: 2500,
    },
    {
      area: "admin protection",
      name: "admin workers protected",
      url: `${baseUrl}/admin/workers`,
      required: ["Admin Login"],
      forbidden: [],
      maxMsWarning: 2500,
    },
    {
      area: "admin protection",
      name: "admin companies protected",
      url: `${baseUrl}/admin/companies`,
      required: ["Admin Login"],
      forbidden: [],
      maxMsWarning: 2500,
    },
    requirementId && {
      area: "admin protection",
      name: "admin requirement detail protected",
      url: `${baseUrl}/admin/requirements/${requirementId}`,
      required: ["Admin Login"],
      forbidden: [],
      maxMsWarning: 2500,
    },
    {
      area: "api",
      name: "WhatsApp webhook exists",
      url: `${baseUrl}/api/whatsapp/webhook`,
      allowedStatuses: [200, 400, 403, 405],
      required: [],
      forbidden: ["WHATSAPP_ACCESS_TOKEN", "OPENAI_API_KEY", "sk-"],
      maxMsWarning: 2500,
    },
  ].filter(Boolean);
}

async function checkRoute(check) {
  const started = Date.now();
  const response = await fetch(check.url, { redirect: "follow" });
  const body = await response.text();
  const ms = Date.now() - started;
  const statusOk = check.allowedStatuses
    ? check.allowedStatuses.includes(response.status)
    : response.ok;
  const found = Object.fromEntries(
    check.required.map((term) => [term, body.toLowerCase().includes(term.toLowerCase())]),
  );
  const forbidden = Object.fromEntries(
    check.forbidden.map((term) => [term, body.toLowerCase().includes(term.toLowerCase())]),
  );
  const requiredOk = Object.values(found).every(Boolean);
  const forbiddenOk = Object.values(forbidden).every((value) => !value);
  const warning = Boolean(check.maxMsWarning && ms > check.maxMsWarning);

  return {
    area: check.area,
    name: check.name,
    ok: statusOk && requiredOk && forbiddenOk,
    warning,
    status: response.status,
    ms,
    url: check.url,
    finalUrl: response.url,
    found,
    forbidden,
  };
}

async function checkQaDataCounts() {
  const [workers, companies, staff, requirements] = await Promise.all([
    supabaseRest("professionals?select=id&full_name=like.Admin%20Test*&limit=1"),
    supabaseRest("companies?select=id&company_name=like.Admin%20Test*&limit=1"),
    supabaseRest("company_listings?select=id&title=like.Admin%20Test*&limit=1"),
    supabaseRest("requirements?select=id&details=like.Admin%20Test*&limit=1"),
  ]);

  return {
    ok:
      workers.length > 0 &&
      companies.length > 0 &&
      staff.length > 0 &&
      requirements.length > 0,
    hasWorkers: workers.length > 0,
    hasCompanies: companies.length > 0,
    hasCompanyStaff: staff.length > 0,
    hasRequirements: requirements.length > 0,
  };
}

function summarize(results) {
  return results.reduce((accumulator, result) => {
    const current = accumulator[result.area] ?? { total: 0, ok: 0, failed: 0, warnings: 0 };
    current.total += 1;
    current.ok += result.ok ? 1 : 0;
    current.failed += result.ok ? 0 : 1;
    current.warnings += result.warning ? 1 : 0;
    accumulator[result.area] = current;
    return accumulator;
  }, {});
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
