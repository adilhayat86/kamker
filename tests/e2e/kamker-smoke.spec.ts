import { expect, type Page, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/categories",
  "/professionals",
  "/register",
  "/register/professional",
  "/register/company",
  "/send-requirement",
  "/proof-upload",
  "/company-listings",
];

async function expectNo404(page: Page) {
  await expect(page.getByRole("heading", { name: "404" })).toHaveCount(0);
  await expect(page.getByText("This page could not be found")).toHaveCount(0);
}

async function expectNoJobBoardWording(page: Page) {
  await expect(page.getByText("Post a Job")).toHaveCount(0);
  await expect(page.getByText("Post Job")).toHaveCount(0);
  await expect(page.getByText("Post a job")).toHaveCount(0);
}

test.describe("Kamker public smoke tests", () => {
  for (const route of publicRoutes) {
    test(`loads ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), route).toBeLessThan(400);
      await expectNo404(page);
      await expectNoJobBoardWording(page);
    });
  }

  test("homepage loads with exact headline and primary sections", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Find part time workers" })).toBeVisible();
    await expect(page.getByPlaceholder("Search nurses, maids, drivers, tutors...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search", exact: true })).toBeVisible();
    expect(await page.getByRole("link", { name: "Register" }).count()).toBeGreaterThan(0);
    await expect(page.getByText("Browse by service group")).toBeVisible();

    const registerLink = page.getByRole("link", { name: "Register" }).first();
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
    await expectNo404(page);
  });

  test("main navigation reaches core pages without 404s", async ({ page }) => {
    await page.goto("/");

    const coreLinks = [
      { name: "View All Categories", pattern: /\/categories/ },
      { name: "Register", pattern: /\/register/ },
    ];

    for (const link of coreLinks) {
      await page.goto("/");
      const locator = page.getByRole("link", { name: link.name }).first();
      await expect(locator).toBeVisible();
      await locator.click();
      await expect(page).toHaveURL(link.pattern);
      await expectNo404(page);
    }

    await page.goto("/categories");
    await expectNo404(page);
    await page.goto("/professionals");
    await expectNo404(page);
    await page.goto("/");
    await expectNo404(page);
  });

  test("professional registration form exposes required fields and availability options", async ({
    page,
  }) => {
    await page.goto("/register/professional");

    const requiredFields = [
      'input[name="fullName"]',
      'input[name="phone"]',
      'select[name="city"]',
      'select[name="gender"]',
      'input[name="age"]',
      'select[name="category"]',
      'select[name="availabilityTime"]',
      'select[name="availabilityDays"]',
      'input[name="rate"]',
      'input[name="tagline"]',
      'input[name="password"]',
      'input[name="secretQuestion"]',
      'input[name="secretAnswer"]',
    ];

    for (const selector of requiredFields) {
      await expect(page.locator(selector), selector).toBeVisible();
    }

    await expect(page.locator('select[name="availabilityTime"]')).toContainText("Morning");
    await expect(page.locator('select[name="availabilityTime"]')).toContainText("Evening");
    await expect(page.locator('select[name="availabilityTime"]')).toContainText("Full Time");
    await expect(page.locator('select[name="availabilityDays"]')).toContainText("Weekend");
    await expect(page.locator('select[name="availabilityDays"]')).toContainText("Weekdays");
    await expect(page.locator('select[name="availabilityDays"]')).toContainText("7 days a week");
    await expectNoJobBoardWording(page);
  });

  test("professionals search and advanced filters load without crashing", async ({ page }) => {
    await page.goto("/professionals?q=Nurse");
    await expect(page).toHaveURL(/\/professionals/);
    await expectNo404(page);

    const filters = page.getByText("Filters: city, category, age, rate, availability");
    await expect(filters).toBeVisible();
    await filters.click();

    await expect(page.locator('select[name="age"]')).toBeVisible();
    await expect(page.locator('select[name="rate"]')).toBeVisible();
    await expect(page.locator('select[name="availabilityTime"]')).toBeVisible();
    await expect(page.locator('select[name="availabilityDays"]')).toBeVisible();
    await expect(page.getByText("Verified only")).toBeVisible();

    const citySelect = page.locator('select[name="city"]');
    const cityOptions = await citySelect.locator("option").count();
    if (cityOptions > 1) {
      const firstCity = await citySelect.locator("option").nth(1).getAttribute("value");
      if (firstCity) {
        await citySelect.selectOption(firstCity);
      }
    }

    await page.getByRole("button", { name: "Apply filters", exact: true }).click();
    await expect(page).toHaveURL(/\/professionals/);
    await expectNo404(page);
  });

  test("professional card profile link works when listings exist", async ({ page }) => {
    await page.goto("/professionals");

    const firstProfileHref = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>(
        'a[href^="/professionals/"], a[href^="/company-listings/"]',
      );
      return link?.getAttribute("href") ?? "";
    });

    if (!firstProfileHref) {
      await expect(page.getByText(/No professionals found|Demo listings are shown/)).toBeVisible();
      return;
    }

    await page.goto(firstProfileHref);
    await expect(page).toHaveURL(/\/(professionals|company-listings)\//);
    await expectNo404(page);
  });

  test("send requirement page shows form fields and no job-board wording", async ({ page }) => {
    await page.goto("/send-requirement");

    for (const selector of [
      'select[name="service"]',
      'select[name="city"]',
      'input[name="area"]',
      'textarea[name="details"]',
      'input[name="budget"]',
      'input[name="phone"]',
      'input[name="whatsapp"]',
      'select[name="urgency"]',
    ]) {
      await expect(page.locator(selector), selector).toBeVisible();
    }

    await expectNoJobBoardWording(page);
  });

  test("admin route stays protected or shows a safe admin state", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(400);
    await expectNo404(page);

    const safeAdminState = page
      .getByText("Admin Login")
      .or(page.getByText("Admin setup required"))
      .or(page.getByText("Operations Dashboard"))
      .or(page.getByText("Dashboard"));

    await expect(safeAdminState.first()).toBeVisible();
    await expectNoJobBoardWording(page);
  });
});
