import {
  logJson,
  productionConfig,
  supabaseRest,
} from "./qa-utils.mjs";

async function main() {
  const { baseUrl } = productionConfig();
  const latest = await latestQaRecords();
  const results = [];

  results.push(await checkCloudinary(baseUrl));
  results.push(await checkSupabaseStorage());

  for (const check of routeChecks(baseUrl, latest)) {
    results.push(await checkRoute(check));
  }

  results.push(await checkPhoneMigration());

  logJson({
    ok: results.every((result) => result.ok || result.warning),
    baseUrl,
    latest,
    results,
  });
}

async function latestQaRecords() {
  const [workers, requirements, companies, staff] = await Promise.all([
    supabaseRest(
      "professionals?select=id,full_name&full_name=like.Admin%20Test%20Worker*&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "requirements?select=id,details&details=like.Admin%20Test%20Requirement*&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "companies?select=id,company_name&company_name=like.Admin%20Test%20Company*&order=created_at.desc&limit=1",
    ),
    supabaseRest(
      "company_listings?select=id,title,company_id&title=like.Admin%20Test%20Staff*&order=created_at.desc&limit=2",
    ),
  ]);

  return {
    worker: workers[0] ?? null,
    requirement: requirements[0] ?? null,
    company: companies[0] ?? null,
    staff,
  };
}

function routeChecks(baseUrl, latest) {
  const workerId = latest.worker?.id;
  const companyId = latest.company?.id;
  const staffId = latest.staff?.[0]?.id;
  const requirementId = latest.requirement?.id;

  return [
    {
      name: "professionals filtered discovery",
      url: `${baseUrl}/professionals?q=nurse&city=Karachi`,
      terms: ["Admin Test Worker Nurse", "Admin Test Staff Nurse", "Worker Profile"],
    },
    {
      name: "nurses category",
      url: `${baseUrl}/categories/nurses`,
      terms: ["Admin Test Staff Nurse"],
      warningTerms: ["Admin Test Worker Nurse"],
    },
    workerId && {
      name: "worker profile",
      url: `${baseUrl}/professionals/${workerId}`,
      terms: ["Admin Test Worker Nurse", "Caring nurse at home", "Age 29"],
    },
    companyId && {
      name: "company profile",
      url: `${baseUrl}/companies/${companyId}`,
      terms: ["Admin Test Company", "Admin Test Staff"],
    },
    staffId && {
      name: "company staff profile",
      url: `${baseUrl}/company-listings/${staffId}`,
      terms: ["Admin Test Staff", "Company Profile"],
    },
    companyId && {
      name: "company packages",
      url: `${baseUrl}/companies/${companyId}/packages`,
      terms: ["Admin Test Company", "Package"],
    },
    companyId && {
      name: "company payment",
      url: `${baseUrl}/companies/${companyId}/payment?package=company_enterprise_monthly`,
      terms: ["Admin Test Company", "receipt"],
    },
    companyId && {
      name: "company dashboard",
      url: `${baseUrl}/companies/${companyId}/dashboard`,
      terms: ["Admin Test Company", "Staff"],
    },
    requirementId && {
      name: "admin requirement protected",
      url: `${baseUrl}/admin/requirements/${requirementId}`,
      terms: ["Admin Login"],
    },
  ].filter(Boolean);
}

async function checkRoute({ name, url, terms, warningTerms = [] }) {
  const started = Date.now();
  const response = await fetch(url, { redirect: "follow" });
  const html = await response.text();
  const found = Object.fromEntries(terms.map((term) => [term, html.includes(term)]));
  const warnings = Object.fromEntries(
    warningTerms.map((term) => [term, html.includes(term)]),
  );

  return {
    name,
    ok: response.ok && Object.values(found).every(Boolean),
    warning: Object.values(found).every(Boolean) && Object.values(warnings).some((value) => !value),
    status: response.status,
    ms: Date.now() - started,
    url,
    finalUrl: response.url,
    found,
    warnings,
  };
}

async function checkCloudinary(baseUrl) {
  const signResponse = await fetch(`${baseUrl}/api/cloudinary/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "professional-photos", tags: ["qa-test"] }),
  });
  const signed = await signResponse.json().catch(() => ({}));

  return {
    name: "Cloudinary signing",
    ok:
      signResponse.ok &&
      Boolean(signed.cloudName) &&
      Boolean(signed.apiKey) &&
      Boolean(signed.signature),
    status: signResponse.status,
    hasCloudName: Boolean(signed.cloudName),
    hasApiKey: Boolean(signed.apiKey),
    hasSignature: Boolean(signed.signature),
    error: signed.error ?? null,
  };
}

async function checkSupabaseStorage() {
  const { supabaseUrl, supabaseAnonKey } = productionConfig();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64",
  );
  const buckets = ["professional-photos", "proof-images", "company-images"];
  const results = [];

  for (const bucket of buckets) {
    const path = `kamker-healthcheck-${Date.now()}.png`;
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: png,
    });
    const publicRead = upload.ok
      ? await fetch(`${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`)
      : null;

    results.push({
      bucket,
      uploadOk: upload.ok,
      uploadStatus: upload.status,
      publicReadStatus: publicRead?.status ?? null,
    });
  }

  return {
    name: "Supabase storage upload/read",
    ok: results.every((result) => result.uploadOk && result.publicReadStatus === 200),
    buckets: results,
  };
}

async function checkPhoneMigration() {
  try {
    await supabaseRest("professionals?select=id,phone_normalized&limit=1");

    return {
      name: "phone ownership migration",
      ok: true,
    };
  } catch (error) {
    return {
      name: "phone ownership migration",
      ok: false,
      warning: true,
      error: error.message,
    };
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
