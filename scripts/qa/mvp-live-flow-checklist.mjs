import { logJson, productionConfig, supabaseExactCount, supabaseRest } from "./qa-utils.mjs";
import { buildLiveTestData } from "./live-test-data.mjs";

const testPrefix = "Admin Test";

const flows = [
  {
    id: "worker_registration",
    area: "Worker marketplace",
    priority: "critical",
    route: "/register/professional",
    testData: "Admin Test Worker Nurse Lahore",
    action:
      "Register a worker with required fields, password/security answer, Pakistan phone, international-capable WhatsApp, age, tagline, and one phone-size photo.",
    expectedResult:
      "Redirects to /account?status=registered or /account?status=registered-photo-skipped and creates one professionals row.",
    proofTables: ["professionals", "professional_sessions"],
    adminCheck: "/admin/workers",
    publicCheck: "/professionals?q=Admin%20Test%20Worker%20Nurse%20Lahore",
  },
  {
    id: "worker_duplicate_phone",
    area: "Worker identity safety",
    priority: "critical",
    route: "/register/professional",
    testData: "Reuse the same worker phone in a second registration",
    action:
      "Submit a second worker registration using the same phone in a different format, for example 0300..., 300..., +92300..., or 92300....",
    expectedResult:
      "Submission is blocked with a clear phone field error and no second active worker owns the same normalized phone.",
    proofTables: ["professionals"],
    adminCheck: "/admin/workers",
    publicCheck: null,
  },
  {
    id: "customer_registration",
    area: "Customer account",
    priority: "important",
    route: "/register/customer",
    testData: "Admin Test Customer Lahore",
    action: "Register a customer with Pakistan phone, city, and area.",
    expectedResult: "Creates one customers row and shows a clear success state.",
    proofTables: ["customers"],
    adminCheck: "/admin",
    publicCheck: null,
  },
  {
    id: "requirement_submission",
    area: "Requirement broadcast tool",
    priority: "critical",
    route: "/send-requirement?category=Nurses&city=Lahore",
    testData: "Admin Test Requirement Nurse Lahore",
    action:
      "Submit a customer requirement with service, city, area, urgency, phone, WhatsApp, and details.",
    expectedResult:
      "Creates one requirements row, creates matching rows when active workers exist, and does not require login.",
    proofTables: ["requirements", "requirement_matches"],
    adminCheck: "/admin/requirements",
    publicCheck: null,
  },
  {
    id: "company_registration",
    area: "Company account",
    priority: "critical",
    route: "/register/company",
    testData: "Admin Test Company Lahore",
    action:
      "Register a company account with company name, contact person, phone, WhatsApp, city, category, and description.",
    expectedResult:
      "Creates one companies row and lands on /companies/[id]/packages so the company can choose a package.",
    proofTables: ["companies"],
    adminCheck: "/admin/companies",
    publicCheck: "/companies/[id]",
  },
  {
    id: "company_package_payment",
    area: "Company payment and AI proof review",
    priority: "critical",
    route: "/companies/[id]/payment?package=company_enterprise_monthly",
    testData: "Admin Test Company payment proof",
    action:
      "Select a package and upload a small valid proof image. Test one correct-looking proof and one wrong receipt when OpenAI billing is available.",
    expectedResult:
      "Creates manual_payments and proof_reviews rows. Auto-approved proofs activate a company_package_subscriptions row; review-needed proofs land on the company dashboard with a clear status.",
    proofTables: ["manual_payments", "proof_reviews", "company_package_subscriptions"],
    adminCheck: "/admin/payments",
    publicCheck: null,
  },
  {
    id: "company_staff_publish",
    area: "Company-managed staff",
    priority: "critical",
    route: "/companies/[id]/listings/new",
    testData: "Admin Test Staff Nurse Lahore",
    action:
      "From a company with an active package, add multiple staff profiles across categories and cities, including repeated categories.",
    expectedResult:
      "Creates pending company_listings rows. Staff are not automatically featured unless a featured slot/action is used.",
    proofTables: ["company_listings"],
    adminCheck: "/admin/company-listings",
    publicCheck: "/professionals?q=Admin%20Test%20Staff",
  },
  {
    id: "admin_worker_actions",
    area: "Admin operations",
    priority: "critical",
    route: "/admin/workers",
    testData: "Admin Test Worker only",
    action:
      "Approve, verify CNIC, verify phone, make featured, remove featured, and remove disputed number on disposable worker records only.",
    expectedResult:
      "Actions mutate the selected worker only, audit logs are written when Supabase allows them, and public profile updates after refresh.",
    proofTables: ["professionals", "admin_audit_logs"],
    adminCheck: "/admin/workers",
    publicCheck: "/professionals",
  },
  {
    id: "admin_company_actions",
    area: "Admin operations",
    priority: "critical",
    route: "/admin/companies",
    testData: "Admin Test Company only",
    action:
      "Review company details, approve/reject verification, inspect package status, and open public profile/dashboard links.",
    expectedResult:
      "Company state changes are visible on admin pages without exposing secrets or changing pricing.",
    proofTables: ["companies", "company_package_subscriptions"],
    adminCheck: "/admin/companies",
    publicCheck: "/companies/[id]",
  },
  {
    id: "admin_company_staff_actions",
    area: "Admin operations",
    priority: "critical",
    route: "/admin/company-listings",
    testData: "Admin Test Staff only",
    action:
      "Approve/reject staff, make/remove featured, and confirm quota warnings respect package listing and featured limits.",
    expectedResult:
      "Approved staff appear in /professionals with Worker Profile and Company Profile buttons. Featured count stays within package limit.",
    proofTables: ["company_listings", "company_package_subscriptions"],
    adminCheck: "/admin/company-listings",
    publicCheck: "/professionals",
  },
  {
    id: "search_and_categories",
    area: "Public discovery",
    priority: "critical",
    route: "/professionals?q=nurse&city=Karachi",
    testData: "Existing production and Admin Test records",
    action:
      "Search by category, city, age, gender, availability, rate, and sort. Open /categories/nurses and one rare category.",
    expectedResult:
      "Individual workers and company-managed staff both appear when they match. Featured profiles appear above regular profiles.",
    proofTables: ["professionals", "company_listings", "analytics_events"],
    adminCheck: "/admin/analytics",
    publicCheck: "/categories/nurses",
  },
  {
    id: "desktop_contact_buttons",
    area: "Conversion UX",
    priority: "important",
    route: "/professionals",
    testData: "Any approved worker with phone and WhatsApp",
    action:
      "On desktop, click Call and WhatsApp. On mobile, repeat using the phone browser.",
    expectedResult:
      "Desktop clearly exposes/copies/opens contact details instead of doing nothing. Mobile opens dialer or WhatsApp.",
    proofTables: ["analytics_events"],
    adminCheck: "/admin/analytics",
    publicCheck: "/professionals",
  },
  {
    id: "admin_readiness",
    area: "Admin command center",
    priority: "critical",
    route: "/admin",
    testData: "Owner admin session",
    action:
      "Log in, open every admin nav item, then log out and confirm protected routes redirect to /admin/login.",
    expectedResult:
      "Dashboard, workers, categories, companies, company staff, payments, featured, analytics, settings, system, audit, and WhatsApp pages load without runtime errors.",
    proofTables: ["admin_audit_logs"],
    adminCheck: "/admin",
    publicCheck: null,
  },
];

async function main() {
  const { baseUrl } = productionConfig();
  const [counts, schemaStatus] = await Promise.all([getCounts(), getSchemaStatus()]);
  const blockers = buildBlockers(schemaStatus);
  const sampleData = buildLiveTestData();

  logJson({
    ok: blockers.length === 0,
    baseUrl,
    generatedAt: new Date().toISOString(),
    purpose:
      "Whole-site MVP live testing checklist. This command does not create or mutate records.",
    currentProductionCounts: counts,
    schemaStatus,
    blockers,
    qaRules: [
      `Use names/descriptions starting with "${testPrefix}".`,
      "Use production only when intentionally testing real Supabase data.",
      "Do not use destructive admin actions on non-test records.",
      "Keep pricing, packages, WhatsApp broadcast behavior, and AI proof rules unchanged.",
    ],
    coverage: summarizeCoverage(),
    sampleData,
    flows,
    nextActions:
      blockers.length > 0
        ? [
            "Apply the pending Supabase migration before final live signup QA.",
            "Run npm run qa:mvp-readiness again.",
            "Generate values with npm run qa:live-test-data, execute these live flows in browser, then run KAMKER_QA_RUN_SUFFIX=<suffix> npm run qa:verify-live-test-run.",
          ]
        : [
            "Generate values with npm run qa:live-test-data.",
            "Execute these live flows in browser using Admin Test records.",
            "After browser submission, run KAMKER_QA_RUN_SUFFIX=<suffix> npm run qa:verify-live-test-run.",
            "Fix failed flows one by one, then rerun qa:mvp-readiness.",
          ],
  });

  if (blockers.length > 0) {
    process.exitCode = 1;
  }
}

async function getCounts() {
  try {
    const [
      professionals,
      activeProfessionals,
      companies,
      companyStaff,
      approvedCompanyStaff,
      requirements,
      matches,
      proofs,
      analyticsEvents,
      testProfessionals,
      testCompanies,
      testStaff,
      testRequirements,
    ] = await Promise.all([
      supabaseExactCount("professionals"),
      supabaseExactCount("professionals", "is_active=eq.true"),
      supabaseExactCount("companies"),
      supabaseExactCount("company_listings"),
      supabaseExactCount("company_listings", "status=eq.approved"),
      supabaseExactCount("requirements"),
      supabaseExactCount("requirement_matches"),
      supabaseExactCount("proof_reviews"),
      supabaseExactCount("analytics_events"),
      supabaseExactCount("professionals", "full_name=like.Admin%20Test*"),
      supabaseExactCount("companies", "company_name=like.Admin%20Test*"),
      supabaseExactCount("company_listings", "title=like.Admin%20Test*"),
      supabaseExactCount("requirements", "details=like.Admin%20Test*"),
    ]);

    return {
      professionals,
      activeProfessionals,
      companies,
      companyStaff,
      approvedCompanyStaff,
      requirements,
      matches,
      proofs,
      analyticsEvents,
      testRecords: {
        professionals: testProfessionals,
        companies: testCompanies,
        companyStaff: testStaff,
        requirements: testRequirements,
      },
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

async function getSchemaStatus() {
  const checks = [
    {
      name: "phone_normalized",
      query: "professionals?select=id,phone_normalized&limit=1",
      requiredFor: "phone uniqueness, duplicate blocking, and disputed number cleanup",
    },
    {
      name: "company staff age",
      query: "company_listings?select=id,age&limit=1",
      requiredFor: "age filters and staff cards",
    },
    {
      name: "admin audit logs",
      query: "admin_audit_logs?select=id,action,target_type,target_id&limit=1",
      requiredFor: "admin action traceability",
    },
    {
      name: "analytics metadata",
      query: "analytics_events?select=id,event_type,metadata&limit=1",
      requiredFor: "campaign/date/category analytics",
    },
  ];

  const results = await Promise.all(checks.map(runSchemaCheck));

  return {
    ready: results.every((result) => result.ok),
    checks: results,
  };
}

async function runSchemaCheck(check) {
  try {
    await supabaseRest(check.query);

    return {
      ...check,
      ok: true,
    };
  } catch (error) {
    return {
      ...check,
      ok: false,
      error: error.message,
    };
  }
}

function buildBlockers(schemaStatus) {
  const blockers = [];
  const failedSchema = schemaStatus.checks.filter((check) => !check.ok);

  if (failedSchema.length > 0) {
    blockers.push({
      area: "production_schema",
      message:
        "Production Supabase schema is not fully aligned with the MVP code. Live flow testing can continue, but final MVP readiness is blocked.",
      failedChecks: failedSchema.map((check) => ({
        name: check.name,
        requiredFor: check.requiredFor,
      })),
    });
  }

  return blockers;
}

function summarizeCoverage() {
  return Object.values(
    flows.reduce((acc, flow) => {
      acc[flow.area] ??= {
        area: flow.area,
        critical: 0,
        important: 0,
        flows: 0,
      };
      acc[flow.area][flow.priority] += 1;
      acc[flow.area].flows += 1;

      return acc;
    }, {}),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
