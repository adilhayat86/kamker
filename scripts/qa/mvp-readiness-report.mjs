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
    area: "media_storage",
    command: "qa:verify-production",
    required: false,
    description:
      "Cloudinary signing, Supabase proof/company/professional storage buckets, key profile routes, and phone migration warning.",
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

  return [
    {
      area: "Public discovery",
      status: byCommand["qa:check-mvp-production"]?.ok ? "pass" : "blocked",
      evidence: "Routes, public pages, no fake stats, no Post a Job wording.",
    },
    {
      area: "Registration and login",
      status: byCommand["qa:check-production-schema"]?.ok ? "ready_to_test" : "blocked",
      evidence:
        "Professional/customer/company forms compile; production schema must match before final signup QA.",
    },
    {
      area: "Company marketplace",
      status: byCommand["qa:check-mvp-production"]?.ok ? "pass" : "blocked",
      evidence:
        "Company package, payment, dashboard, public company profile, and company-managed staff routes are smoke-tested.",
    },
    {
      area: "Admin operations",
      status: byCommand["qa:check-mvp-production"]?.ok ? "protected" : "blocked",
      evidence:
        "Admin routes are protected in production smoke; admin action testing still needs logged-in browser QA.",
    },
    {
      area: "Media uploads",
      status: byCommand["qa:verify-production"]?.ok ? "pass" : "warning",
      evidence:
        "Cloudinary signing and Supabase storage upload/read checks are covered by qa:verify-production.",
    },
    {
      area: "Phone ownership",
      status: byCommand["qa:check-production-phones"]?.ok ? "pass" : "blocked",
      evidence:
        "Duplicate or invalid legacy worker phones must be cleaned before the unique phone migration is applied.",
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

  if (failed["qa:check-mvp-production"]) {
    actions.push(
      "Fix public route smoke failures before more production form testing.",
    );
  }

  actions.push(
    "Run visible browser QA for real submissions: worker, customer, company, package proof, company staff, requirement, and admin approval.",
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

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
