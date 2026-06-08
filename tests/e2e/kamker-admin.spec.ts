import { expect, type Page, test } from "@playwright/test";

const adminPassword = process.env.KAMKER_E2E_ADMIN_PASSWORD;

const adminRoutes = [
  "/admin",
  "/admin/categories",
  "/admin/cities",
  "/admin/workers",
  "/admin/companies",
  "/admin/company-listings",
  "/admin/requirements",
  "/admin/payments",
  "/admin/featured",
  "/admin/analytics",
  "/admin/whatsapp",
  "/admin/settings",
  "/admin/system",
  "/admin/audit",
];

async function expectNo404(page: Page) {
  await expect(page.getByRole("heading", { name: /^404$/ })).toHaveCount(0);
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
}

async function expectNoJobBoardWording(page: Page) {
  await expect(page.getByText("Post a Job")).toHaveCount(0);
  await expect(page.getByText("Post Job")).toHaveCount(0);
  await expect(page.getByText("Post a job")).toHaveCount(0);
}

async function loginAsOwner(page: Page) {
  test.skip(!adminPassword, "Set KAMKER_E2E_ADMIN_PASSWORD to run admin E2E tests.");

  await page.goto("/admin/logout", { waitUntil: "domcontentloaded" });
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
  await page.locator('select[name="role"]').selectOption("owner");
  await page.locator('input[name="password"]').fill(adminPassword as string);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/admin(?:$|\?)/);
  await expect(page.getByText("Kamker Admin")).toBeVisible();
}

test.describe("Kamker admin operations smoke tests", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("owner can open every admin operations page", async ({ page }) => {
    for (const route of adminRoutes) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.getByText("Protected admin")).toBeVisible();
      await expect(page.getByText("Kamker Admin")).toBeVisible();
      await expectNo404(page);
      await expectNoJobBoardWording(page);
    }
  });

  test("owner can add disposable city and category records", async ({ page }) => {
    const stamp = Date.now();
    const cityName = `Admin Test City ${stamp}`;
    const groupName = `Admin Test Service ${stamp}`;
    const subcategoryName = `Admin Test Subcategory ${stamp}`;

    await page.goto("/admin/cities", { waitUntil: "domcontentloaded" });
    await page.getByLabel("City name").fill(cityName);
    await page.getByRole("button", { name: "Add City" }).click();
    await expect(page.getByRole("link", { name: cityName })).toBeVisible();
    await expectNo404(page);

    await page.goto("/admin/categories", { waitUntil: "domcontentloaded" });
    const serviceGroupForm = page.locator("form", {
      has: page.getByRole("button", { name: "Add Service Group" }),
    });
    await serviceGroupForm.getByLabel("Service group name").fill(groupName);
    await serviceGroupForm
      .getByLabel("Description")
      .fill("Disposable Admin Test service group for Playwright QA.");
    await serviceGroupForm.getByRole("button", { name: "Add Service Group" }).click();
    await expect(page.getByRole("heading", { name: groupName })).toBeVisible();

    const subcategoryForm = page.locator("form", {
      has: page.getByRole("button", { name: "Add Subcategory" }),
    });
    await subcategoryForm
      .locator('select[name="parentId"]')
      .selectOption({ label: groupName });
    await subcategoryForm.getByLabel("Subcategory name").fill(subcategoryName);
    await subcategoryForm
      .getByLabel("Description")
      .fill("Disposable Admin Test subcategory for Playwright QA.");
    await subcategoryForm.getByRole("button", { name: "Add Subcategory" }).click();
    await expect(page.getByRole("link", { name: subcategoryName })).toBeVisible();
    await expectNoJobBoardWording(page);
  });

  test("management pages expose the expected review controls or safe empty states", async ({
    page,
  }) => {
    const pages = [
      {
        route: "/admin/workers",
        requiredText: ["Search & Filters", "Worker Profiles"],
      },
      {
        route: "/admin/companies",
        requiredText: ["Companies", "Company"],
      },
      {
        route: "/admin/company-listings",
        requiredText: ["Company Staff", "Staff"],
      },
      {
        route: "/admin/payments",
        requiredText: ["Payments", "Proof"],
      },
      {
        route: "/admin/featured",
        requiredText: ["Featured"],
      },
      {
        route: "/admin/requirements",
        requiredText: ["Requirements"],
      },
    ];

    for (const adminPage of pages) {
      await page.goto(adminPage.route, { waitUntil: "domcontentloaded" });
      for (const text of adminPage.requiredText) {
        await expect(page.getByText(text).first()).toBeVisible();
      }
      await expectNo404(page);
      await expectNoJobBoardWording(page);
    }
  });

  test("requirement detail links open when requirements exist", async ({ page }) => {
    await page.goto("/admin/requirements", { waitUntil: "domcontentloaded" });

    const detailHref = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>('a[href^="/admin/requirements/"]');
      return link?.getAttribute("href") ?? "";
    });

    if (!detailHref) {
      await expect(page.getByText(/No requirements|Requirements/i).first()).toBeVisible();
      return;
    }

    await page.goto(detailHref, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/requirements\//);
    await expectNo404(page);
    await expectNoJobBoardWording(page);
  });

  test("admin logout protects operations routes again", async ({ page }) => {
    await page.goto("/admin/logout", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/workers", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "Admin Login" })).toBeVisible();
  });
});
