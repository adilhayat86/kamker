import { logJson, productionConfig, supabaseRest } from "./qa-utils.mjs";

const protectedRoutes = [
  "/admin",
  "/admin/analytics",
  "/admin/audit",
  "/admin/categories",
  "/admin/change-password",
  "/admin/cities",
  "/admin/companies",
  "/admin/company-listings",
  "/admin/featured",
  "/admin/payments",
  "/admin/requirements",
  "/admin/settings",
  "/admin/system",
  "/admin/whatsapp",
  "/admin/workers",
];

const publicAdminRoutes = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

async function main() {
  const { baseUrl } = productionConfig();
  const requirement = await latestRequirement();
  const routes = requirement?.id
    ? [...protectedRoutes, `/admin/requirements/${requirement.id}`]
    : protectedRoutes;

  const [protectedResults, publicResults] = await Promise.all([
    Promise.all(routes.map((route) => checkProtectedRoute(baseUrl, route))),
    Promise.all(publicAdminRoutes.map((route) => checkPublicAdminRoute(baseUrl, route))),
  ]);
  const results = [...protectedResults, ...publicResults];
  const failures = results.filter((result) => !result.ok);

  logJson({
    ok: failures.length === 0,
    baseUrl,
    checkedAt: new Date().toISOString(),
    summary: {
      protectedRoutes: protectedResults.length,
      publicAdminRoutes: publicResults.length,
      failures: failures.length,
    },
    failures,
    results,
  });

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function latestRequirement() {
  try {
    const rows = await supabaseRest(
      "requirements?select=id&details=like.Admin%20Test*&order=created_at.desc&limit=1",
    );

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function checkProtectedRoute(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "follow" });
  const body = await response.text();
  const finalUrl = response.url;
  const redirectedToLogin = finalUrl.includes("/admin/login");
  const showsLogin = body.toLowerCase().includes("admin login");
  const leaksAdminContent =
    body.includes("System Health | Kamker Admin") ||
    body.includes("Admin Dashboard") ||
    body.includes("Needs Review");

  return {
    type: "protected",
    route,
    ok: response.ok && redirectedToLogin && showsLogin && !leaksAdminContent,
    status: response.status,
    finalUrl,
    redirectedToLogin,
    showsLogin,
    leaksAdminContent,
  };
}

async function checkPublicAdminRoute(baseUrl, route) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "follow" });
  const body = await response.text();
  const finalUrl = response.url;
  const showsExpectedAuthUi =
    body.toLowerCase().includes("admin login") ||
    body.toLowerCase().includes("forgot") ||
    body.toLowerCase().includes("reset");

  return {
    type: "public-admin-auth",
    route,
    ok: response.ok && finalUrl.includes(route) && showsExpectedAuthUi,
    status: response.status,
    finalUrl,
    showsExpectedAuthUi,
  };
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
