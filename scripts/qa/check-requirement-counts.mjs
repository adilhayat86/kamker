const baseUrl = (process.env.KAMKER_QA_BASE_URL || "https://kamker.com").replace(/\/$/, "");
const runId = Date.now();

function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function readPage(path) {
  const url = `${baseUrl}${path}${path.includes("?") ? "&" : "?"}qa=count-check-${runId}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Kamker count QA",
    },
  });

  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }

  const html = await response.text();
  return {
    html,
    text: textFromHtml(html),
    url,
  };
}

function numberFrom(value) {
  return Number((value || "").replace(/,/g, ""));
}

function sendRequirementCount(text) {
  const match = text.match(/Send Requirement to\s+([\d,]+)/i);
  return match ? numberFrom(match[1]) : null;
}

function estimatedRecipientCount(text) {
  const match = text.match(/Estimated recipients:\s*([\d,]+)/i);
  return match ? numberFrom(match[1]) : null;
}

function foundCount(text) {
  const match = text.match(/Found\s+([\d,]+)/i);
  return match ? numberFrom(match[1]) : null;
}

function visibleProfileActionCount(text) {
  const workerProfiles = text.match(/\bWorker Profile\b/g)?.length ?? 0;
  const individualProfiles = text.match(/\bView Profile\b/g)?.length ?? 0;
  return workerProfiles + individualProfiles;
}

function categoryCardCountSum(html) {
  const categoryLinks = [
    ...html.matchAll(/<a\b[^>]*href=["']\/categories\/[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi),
  ];

  return categoryLinks.reduce((total, match) => {
    const linkText = textFromHtml(match[1]);
    const countMatch = linkText.match(/([\d,]+)\s+available/i);

    return total + (countMatch ? numberFrom(countMatch[1]) : 0);
  }, 0);
}

function expectEqual(name, actual, expected, detail) {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, got ${actual}. ${detail}`);
  }
}

async function checkSubcategory({ name, categoryPath, requirementPath }) {
  const categoryPage = await readPage(categoryPath);
  const requirementPage = await readPage(requirementPath);
  const categoryCount = sendRequirementCount(categoryPage.text);
  const requirementCount = estimatedRecipientCount(requirementPage.text);
  const profileCount = visibleProfileActionCount(categoryPage.text);

  expectEqual(`${name} category CTA vs visible profiles`, categoryCount, profileCount, categoryPage.url);
  expectEqual(`${name} requirement page vs category CTA`, requirementCount, categoryCount, requirementPage.url);

  return { name, categoryCount, requirementCount, profileCount };
}

async function checkParent({ name, categoryPath, requirementPath }) {
  const categoryPage = await readPage(categoryPath);
  const requirementPage = await readPage(requirementPath);
  const categoryCount = sendRequirementCount(categoryPage.text);
  const cardSum = categoryCardCountSum(categoryPage.html);
  const requirementCount = estimatedRecipientCount(requirementPage.text);

  expectEqual(`${name} parent CTA vs subcategory card sum`, categoryCount, cardSum, categoryPage.url);
  expectEqual(`${name} requirement page vs parent CTA`, requirementCount, categoryCount, requirementPage.url);

  return { name, categoryCount, requirementCount, cardSum };
}

async function checkSearch({ name, path }) {
  const page = await readPage(path);
  const resultCount = foundCount(page.text);
  const ctaCount = sendRequirementCount(page.text);

  expectEqual(`${name} search summary vs CTA`, ctaCount, resultCount, page.url);

  return { name, resultCount, ctaCount };
}

const results = [];

results.push(
  await checkSubcategory({
    name: "Babysitters",
    categoryPath: "/categories/babysitters",
    requirementPath: "/send-requirement?category=Domestic+Help&subcategory=Babysitters",
  }),
);
results.push(
  await checkSubcategory({
    name: "Lab Technicians",
    categoryPath: "/categories/lab-technicians",
    requirementPath: "/send-requirement?category=Healthcare&subcategory=Lab+Technicians",
  }),
);
results.push(
  await checkParent({
    name: "Healthcare",
    categoryPath: "/categories/healthcare",
    requirementPath: "/send-requirement?category=Healthcare",
  }),
);
results.push(
  await checkParent({
    name: "Domestic Help Lahore",
    categoryPath: "/categories/domestic-help?city=Lahore",
    requirementPath: "/send-requirement?category=Domestic+Help&city=Lahore",
  }),
);
results.push(
  await checkSearch({
    name: "Drivers Rawalpindi",
    path: "/professionals?q=drivers&city=Rawalpindi&category=&gender=&availabilityTime=&age=&availabilityDays=&rate=&sort=featured",
  }),
);

console.log(JSON.stringify({ ok: true, baseUrl, results }, null, 2));
