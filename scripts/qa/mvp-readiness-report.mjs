import { spawnSync } from "node:child_process";
import { logJson, productionConfig, supabaseExactCount } from "./qa-utils.mjs";

const checks = [
  {
    area: "public_website",
    command: "qa:check-mvp-production",
    required: true,
    description:
      "Homepage, categories, professionals, profiles, company pages, registration pages, admin protection, and forbidden wording.",
  },
  {
    area: "public_performance",
    command: "qa:check-public-performance",
    required: false,
    description:
      "Multi-sample Vercel route timing for homepage, discovery, registration, profile, and company pages.",
  },
  {
    area: "production_schema",
    command: "qa:check-production-schema",
    required: true,
    description:
      "Supabase tables and app-facing columns required by registration, login, companies, media, admin, analytics, and matching.",
  },
  {
    area: "phone_identity",
    command: "qa:check-production-phones",
    required: true,
    description:
      "Worker phone uniqueness and validity before the phone ownership migration can be safely applied.",
  },
  {
    area: "admin_route_protection",
    command: "qa:check-admin-routes",
    required: true,
    description:
      "Every production admin operations page must redirect to admin login when no admin session exists.",
  },
  {
    area: "media_storage",
    command: "qa:verify-production",
    required: false,
    description:
      "Cloudinary signing, Supabase proof/company/professional storage buckets, key profile routes, and phone migration warning.",
  },
  {
    area: "company_package_rules",
    command: "qa:check-company-package-rules",
    required: true,
    description:
      "Approved company staff and featured company staff must stay within active package listing and featured limits.",
  },
];

async function main() {
  const { baseUrl } = productionConfig();
  const started = Date.now();
  const results = checks.map(runNpmScript);
  const productionCounts = await getProductionCounts();
  const blockers = results.filter((result) => result.required && !result.ok);
  const warnings = results.filter((result) => !result.required && !result.ok);

  logJson({
    ok: blockers.length === 0,
    baseUrl,
    checkedAt: new Date().toISOString(),
    ms: Date.now() - started,
    verdict: buildVerdict(blockers, warnings),
    mvpAreas: buildMvpAreas(results, productionCounts),
    productionCounts,
    blockers: blockers.map(summarizeResult),
    warnings: warnings.map(summarizeResult),
    migrationHelp: extractMigrationHelp(results),
    results: results.map(summarizeResult),
    nextActions: buildNextActions(results),
  });

  if (blockers.length > 0) {
    process.exitCode = 1;
  }
}

function runNpmScript(check) {
  const started = Date.now();
  const result = spawnSync(`npm run --silent ${check.command}`, {
    encoding: "utf8",
    shell: true,
  });

  return {
    ...check,
    ok: result.status === 0,
    status: result.status,
    ms: Date.now() - started,
    spawnError: result.error?.message ?? null,
    stdoutSummary: extractUsefulSummary(result.stdout),
    stderrSummary: extractUsefulSummary(result.stderr),
  };
}

async function getProductionCounts() {
  try {
    const [
      professionals,
      companies,
      companyStaff,
      requirements,
      categories,
      cities,
      proofs,
      analyticsEvents,
    ] = await Promise.all([
      supabaseExactCount("professionals"),
      supabaseExactCount("companies"),
      supabaseExactCount("company_listings"),
      supabaseExactCount("requirements"),
      supabaseExactCount("categories"),
      supabaseExactCount("cities"),
      supabaseExactCount("proof_reviews"),
      supabaseExactCount("analytics_events"),
    ]);

    return {
      professionals,
      companies,
      companyStaff,
      requirements,
      categories,
      cities,
      proofs,
      analyticsEvents,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

function buildMvpAreas(results, counts) {
  const byCommand = Object.fromEntries(results.map((result) => [result.command, result]));
  const publicOk = byCommand["qa:check-mvp-production"]?.ok;
  const performanceOk = byCommand["qa:check-public-performance"]?.ok;
  const schemaOk = byCommand["qa:check-production-schema"]?.ok;
  const phonesOk = byCommand["qa:check-production-phones"]?.ok;
  const adminRoutesOk = byCommand["qa:check-admin-routes"]?.ok;
  const mediaOk = byCommand["qa:verify-production"]?.ok;
  const packagesOk = byCommand["qa:check-company-package-rules"]?.ok;

  return [
    {
      area: "Public discovery",
      status: publicOk ? "pass" : "blocked",
      evidence:
        "Homepage, categories, professionals, category pages, profiles, and forbidden wording are smoke-tested.",
    },
    {
      area: "Public performance",
      status: performanceOk ? "pass" : "warning",
      evidence:
        "Vercel route speed is checked with multiple samples so one cold response does not distort MVP decisions.",
    },
    {
      area: "Search and category matching",
      status: publicOk ? "pass" : "blocked",
      evidence:
        "Production search/category smoke checks include filtered professionals, category pages, and company-managed staff.",
    },
    {
      area: "Worker registration and login",
      status: schemaOk ? "ready_for_live_qa" : "migration_pending",
      evidence:
        "Professional form renders in production; final duplicate-phone and ownership QA requires the phone migration.",
    },
    {
      area: "Customer registration and requirements",
      status: publicOk ? "ready_for_live_qa" : "blocked",
      evidence:
        "Customer registration and Send Requirement routes render publicly; live submit QA should verify rows and matches.",
    },
    {
      area: "Company registration and packages",
      status: publicOk && packagesOk ? "pass" : "blocked",
      evidence:
        "Company registration, package selection, payment proof route, dashboard route, and package limits are checked.",
    },
    {
      area: "Company marketplace",
      status:
        publicOk && packagesOk ? "pass" : "blocked",
      evidence:
        "Public company profiles and company-managed staff profiles are checked beside individual workers.",
    },
    {
      area: "Payments and proof review",
      status: mediaOk ? "ready_for_live_qa" : "warning",
      evidence:
        "Proof upload page, storage checks, Cloudinary signing, and AI-proof-safe paths are covered; live proof review still needs browser QA.",
    },
    {
      area: "Admin operations",
      status: adminRoutesOk ? "protected_needs_live_action_qa" : "blocked",
      evidence:
        "All admin operation routes must redirect to login when logged out; logged-in action testing still needs visible browser QA.",
    },
    {
      area: "Media uploads",
      status: mediaOk ? "pass" : "warning",
      evidence:
        "Cloudinary signing and Supabase storage upload/read checks are covered for profile/company/proof media.",
    },
    {
      area: "Phone ownership",
      status: schemaOk && phonesOk ? "pass" : phonesOk ? "migration_pending" : "blocked",
      evidence:
        "Production phone data is clean; the unique phone ownership column/index migration still must be applied.",
    },
    {
      area: "Analytics and test data",
      status:
        counts && !counts.error && Number(counts.analyticsEvents ?? 0) >= 0
          ? "data_visible"
          : "warning",
      evidence:
        "Production counts are readable; analytics quality depends on real traffic and click tracking during QA.",
    },
    {
      area: "Final launch cleanup",
      status:
        schemaOk && publicOk && packagesOk && mediaOk ? "ready_after_live_qa" : "not_ready",
      evidence:
        "After migrations and visible end-to-end QA pass, remove disposable Admin Test records before public launch.",
    },
  ];
}

function buildVerdict(blockers, warnings) {
  if (blockers.length > 0) {
    return "MVP is not deployment-ready yet. Public routes are mostly testable, but required production data/schema blockers remain.";
  }

  if (warnings.length > 0) {
    return "MVP is close. Required checks pass, but warnings should be reviewed before launch.";
  }

  return "MVP readiness checks pass. Continue with visible end-to-end browser testing and final cleanup.";
}

function buildNextActions(results) {
  const failed = Object.fromEntries(results.map((result) => [result.command, !result.ok]));
  const actions = [];

  if (failed["qa:check-production-phones"]) {
    actions.push(
      "Clean duplicate/invalid worker phone numbers, then apply sql/20260608_phone_ownership_rules.sql in Supabase.",
    );
  }

  if (failed["qa:check-admin-routes"]) {
    actions.push(
      "Fix admin route protection before production launch; every admin operations page must redirect to /admin/login when logged out.",
    );
  }

  if (failed["qa:check-production-schema"]) {
    actions.push(
      "Apply pending Supabase SQL migrations, then rerun npm run qa:check-production-schema.",
    );
  }

  if (failed["qa:verify-production"]) {
    actions.push(
      "Review Cloudinary/Supabase storage and media settings; photo/video uploads are not fully proven until this is green.",
    );
  }

  if (failed["qa:check-company-package-rules"]) {
    actions.push(
      "Fix company staff listings that exceed active package published/featured limits.",
    );
  }

  if (failed["qa:check-mvp-production"]) {
    actions.push(
      "Fix public route smoke failures before more production form testing.",
    );
  }

  actions.push(
    "Run npm run qa:mvp-live-flow-checklist, then execute visible browser QA for real submissions: worker, customer, company, package proof, company staff, requirement, search, contact buttons, analytics, and admin approval.",
  );

  return actions;
}

function summarizeResult(result) {
  return {
    area: result.area,
    command: result.command,
    ok: result.ok,
    required: result.required,
    ms: result.ms,
    description: result.description,
    stdoutSummary: result.stdoutSummary,
    stderrSummary: result.stderrSummary,
  };
}

function extractMigrationHelp(results) {
  const schemaResult = results.find((result) => result.command === "qa:check-production-schema");
  const schemaSummary = parseSummary(schemaResult?.stdoutSummary);

  return schemaSummary?.migrationHelp ?? null;
}

function extractUsefulSummary(text) {
  const trimmed = (text ?? "").trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed);

    return JSON.stringify(
      {
        ok: parsed.ok,
        deployReady: parsed.deployReady,
        verdict: parsed.verdict,
        requiredFailures: parsed.requiredFailures,
        migrationHelp: parsed.migrationHelp,
        summary: parsed.summary,
        qaData: parsed.qaData,
        failures: parsed.failures?.map?.((failure) => failure.name) ?? undefined,
        warnings: parsed.warnings?.map?.((warning) => warning.name) ?? undefined,
        missingOrBrokenChecks:
          parsed.missingOrBrokenChecks?.map?.((failure) => failure.name) ?? undefined,
      },
      null,
      2,
    );
  } catch {
    return trimmed.split(/\r?\n/).slice(-12).join("\n");
  }
}

function parseSummary(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
