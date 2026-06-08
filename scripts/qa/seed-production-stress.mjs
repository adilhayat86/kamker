import crypto from "node:crypto";
import fs from "node:fs";

import {
  hashSecret,
  logJson,
  qaPrefix,
  supabaseRest,
} from "./qa-utils.mjs";

const totalTarget = Number(process.env.KAMKER_QA_STRESS_TOTAL ?? 10000);
const batchSize = Math.min(Number(process.env.KAMKER_QA_STRESS_BATCH ?? 250), 500);
const runId = process.env.KAMKER_QA_STRESS_RUN_ID ?? String(Date.now());
const workerRatio = Number(process.env.KAMKER_QA_STRESS_WORKER_RATIO ?? 0.65);
const companyCount = Number(process.env.KAMKER_QA_STRESS_COMPANIES ?? 20);
const dryRun = process.env.KAMKER_QA_STRESS_DRY_RUN === "1";

const cities = [
  ["Karachi", ["Gulshan-e-Iqbal", "North Nazimabad", "DHA", "Saddar", "Korangi", "Malir"]],
  ["Lahore", ["Johar Town", "DHA", "Model Town", "Gulberg", "Township", "Raiwind Road"]],
  ["Islamabad", ["G-10", "F-8", "I-8", "Blue Area", "Bahria Town", "PWD"]],
  ["Rawalpindi", ["Saddar", "Bahria Town", "Satellite Town", "Chaklala", "Committee Chowk"]],
  ["Peshawar", ["Hayatabad", "University Town", "Saddar", "Gulbahar", "Ring Road"]],
  ["Faisalabad", ["D Ground", "Madina Town", "Jinnah Colony", "People Colony"]],
  ["Multan", ["Gulgasht", "Cantt", "Shah Rukn-e-Alam", "New Multan"]],
  ["Quetta", ["Cantt", "Satellite Town", "Jinnah Town", "Brewery Road"]],
];

const highDemandCategories = new Set([
  "Nurses",
  "Maids",
  "Drivers",
  "School Teachers",
  "Cooks",
  "Security Guards",
  "Beauticians",
  "Electricians",
  "Plumbers",
  "Delivery Riders",
  "AC Technicians",
  "Cleaners",
]);

const femalePreferred = new Set([
  "Nurses",
  "Caregivers",
  "Maids",
  "Housekeepers",
  "Babysitters",
  "School Teachers",
  "Home Tutors",
  "Online Tutors",
  "Quran Teachers",
  "Beauticians",
  "Makeup Artists",
  "Skin Care Specialists",
  "Tailors",
]);

const malePreferred = new Set([
  "Drivers",
  "Delivery Riders",
  "Truck Drivers",
  "Bus Drivers",
  "Forklift/Crane Operators",
  "Electricians",
  "Plumbers",
  "AC Technicians",
  "Carpenters",
  "Painters",
  "Welders",
  "Masons",
  "Tile Setters",
  "Construction Labor",
  "Security Guards",
  "Bodyguards",
  "Car Mechanics",
  "Auto Electricians",
  "Auto AC Mechanics",
  "Car Painters/Denters",
  "Car Wash/Detailing",
]);

const firstNamesFemale = [
  "Ayesha",
  "Maryam",
  "Hafsa",
  "Sadia",
  "Nadia",
  "Iqra",
  "Zainab",
  "Kiran",
  "Samina",
  "Mehwish",
  "Rabia",
  "Sana",
];

const firstNamesMale = [
  "Ali",
  "Bilal",
  "Usman",
  "Hamza",
  "Imran",
  "Waqas",
  "Adnan",
  "Naveed",
  "Faisal",
  "Shahid",
  "Kashif",
  "Asif",
];

const lastNames = [
  "Ahmed",
  "Khan",
  "Raza",
  "Malik",
  "Sheikh",
  "Butt",
  "Qureshi",
  "Siddiqui",
  "Javed",
  "Iqbal",
  "Hussain",
  "Akhtar",
];

const availabilityTimeOptions = ["morning", "evening", "full_time"];
const availabilityDayOptions = ["weekdays", "weekend", "seven_days"];

function readCanonicalCategories() {
  const source = fs.readFileSync("src/lib/marketplace-data.ts", "utf8");
  const categoryBlock = source.match(/export const categories = \[([\s\S]*?)\];/);
  const groupBlock = source.match(/export const serviceGroups: ServiceGroup\[] = \[([\s\S]*?)\];/);

  if (!categoryBlock || !groupBlock) {
    throw new Error("Could not parse canonical categories from src/lib/marketplace-data.ts.");
  }

  const categories = [...categoryBlock[1].matchAll(/\{\s*name:\s*"([^"]+)",\s*icon:\s*"([^"]+)"/g)].map(
    (match) => ({ name: match[1], icon: match[2] }),
  );
  const categoryToGroup = new Map();

  for (const groupMatch of groupBlock[1].matchAll(/name:\s*"([^"]+)"[\s\S]*?subcategories:\s*\[([^\]]+)\]/g)) {
    const groupName = groupMatch[1];
    const subcategories = [...groupMatch[2].matchAll(/"([^"]+)"/g)].map((match) => match[1]);

    subcategories.forEach((subcategory) => categoryToGroup.set(subcategory, groupName));
  }

  return categories.map((category) => ({
    ...category,
    serviceGroup: categoryToGroup.get(category.name) ?? "Other",
  }));
}

function weightedCategoryList(categories) {
  return categories.flatMap((category) => {
    const weight = highDemandCategories.has(category.name) ? 6 : 2;

    return Array.from({ length: weight }, () => category);
  });
}

function pick(items, index) {
  return items[index % items.length];
}

function genderFor(categoryName, index) {
  if (femalePreferred.has(categoryName)) {
    return index % 5 === 0 ? "Male" : "Female";
  }

  if (malePreferred.has(categoryName)) {
    return index % 6 === 0 ? "Female" : "Male";
  }

  return index % 2 === 0 ? "Male" : "Female";
}

function qaMobile(index) {
  const number = 3000000000 + (Number(runId.slice(-5)) * 10000) + index;

  return `+92${String(number).slice(0, 10)}`;
}

function hourlyRate(categoryName, index) {
  const lower = categoryName.toLowerCase();
  const base = lower.includes("consultant") || lower.includes("developer")
    ? 2200
    : lower.includes("nurse") || lower.includes("technician") || lower.includes("mechanic")
      ? 900
      : lower.includes("driver") || lower.includes("maid") || lower.includes("cleaner")
        ? 500
        : 700;

  return base + ((index % 9) * 100);
}

function tagline(categoryName, index) {
  const phrases = [
    `Trusted ${categoryName}`,
    `Reliable ${categoryName}`,
    `Experienced ${categoryName}`,
    `Fast local help`,
    `Direct contact worker`,
  ];

  return pick(phrases, index).slice(0, 30);
}

function fullName(gender, index) {
  const firstNames = gender === "Female" ? firstNamesFemale : firstNamesMale;

  return `${pick(firstNames, index)} ${pick(lastNames, index + 4)}`;
}

async function ensureLookupRows(table, names) {
  const existing = await supabaseRest(
    `${table}?select=id,name&name=in.(${names.map(encodeURIComponent).join(",")})`,
  );
  const existingNames = new Set(existing.map((row) => row.name));
  const missingNames = names.filter((name) => !existingNames.has(name));

  if (missingNames.length > 0) {
    await supabaseRest(table, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(missingNames.map((name) => ({ name }))),
    });
  }

  return supabaseRest(
    `${table}?select=id,name&name=in.(${names.map(encodeURIComponent).join(",")})`,
  );
}

async function loadLookups(canonicalCategories) {
  const categoryRows = await supabaseRest(
    `categories?select=id,name&name=in.(${canonicalCategories.map((category) => encodeURIComponent(category.name)).join(",")})`,
  );
  const missingCategories = canonicalCategories
    .map((category) => category.name)
    .filter((name) => !categoryRows.some((row) => row.name === name));

  if (missingCategories.length > 0) {
    throw new Error(
      `Missing canonical categories in Supabase. Apply sql/20260608_canonical_categories.sql first. Missing: ${missingCategories.slice(0, 20).join(", ")}${missingCategories.length > 20 ? "..." : ""}`,
    );
  }

  const cityRows = await ensureLookupRows("cities", cities.map(([name]) => name));

  return {
    cityByName: new Map(cityRows.map((row) => [row.name, row])),
    categoryByName: new Map(categoryRows.map((row) => [row.name, row])),
  };
}

async function hasProfessionalPhoneNormalizedColumn() {
  try {
    await supabaseRest("professionals?select=id,phone_normalized&limit=1");
    return true;
  } catch (error) {
    if (String(error.message).includes("phone_normalized")) {
      return false;
    }

    throw error;
  }
}

async function insertBatches(table, rows, select = "id") {
  const created = [];

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const result = await supabaseRest(`${table}?select=${select}`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(batch),
    });

    created.push(...result);
    process.stdout.write(`\r${table}: ${Math.min(start + batch.length, rows.length)}/${rows.length}`);
  }

  process.stdout.write("\n");
  return created;
}

async function createCompanies() {
  const rows = Array.from({ length: companyCount }, (_, index) => {
    const [cityName, cityAreas] = pick(cities, index);

    return {
      owner_user_id: crypto.randomUUID(),
      company_name: `${qaPrefix} Stress Company ${index + 1} ${runId}`,
      category: pick(["Healthcare", "Domestic Help", "Security", "Transport & Delivery", "Office, Accounts & Support"], index),
      city: cityName,
      area: pick(cityAreas, index),
      contact_person: `${qaPrefix} Company Owner ${index + 1}`,
      phone: qaMobile(700000 + index),
      whatsapp: qaMobile(700000 + index),
      description: `${qaPrefix} stress-test company. Safe to delete after MVP testing.`,
      license_number: `QA-STRESS-${runId}-${index + 1}`,
      verification_status: "verified",
      payment_status: "paid",
      logo_url: null,
    };
  });

  const companies = await insertBatches("companies", rows, "id,company_name,phone,whatsapp");
  const packageRow = await supabaseRest(
    "company_packages?select=id,package_key,listings_limit,featured_limit&package_key=eq.company_starter_monthly&limit=1",
  );

  if (packageRow[0]) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    await insertBatches(
      "company_package_subscriptions",
      companies.map((company) => ({
        company_id: company.id,
        package_id: packageRow[0].id,
        package_key: packageRow[0].package_key,
        listings_limit: packageRow[0].listings_limit,
        featured_limit: packageRow[0].featured_limit,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "active",
      })),
      "id",
    );
  }

  return companies;
}

async function createWorkers({
  canonicalCategories,
  weightedCategories,
  cityByName,
  categoryByName,
  total,
  hasPhoneNormalized,
}) {
  const passwordHash = await hashSecret("TestPass123!");
  const secretAnswerHash = await hashSecret("blue");
  const rows = Array.from({ length: total }, (_, index) => {
    const category = pick(weightedCategories, index);
    const [cityName, cityAreas] = pick(cities, index + Math.floor(index / 7));
    const city = cityByName.get(cityName);
    const categoryRow = categoryByName.get(category.name);
    const gender = genderFor(category.name, index);
    const rate = hourlyRate(category.name, index);
    const years = 1 + (index % 18);
    const availabilityTime = pick(availabilityTimeOptions, index);
    const availabilityDays = pick(availabilityDayOptions, index + 1);

    const phone = qaMobile(index + 1);
    const row = {
      full_name: `${qaPrefix} Stress Worker ${fullName(gender, index)} ${category.name} ${index + 1} ${runId}`,
      phone_number: phone,
      whatsapp_number: phone,
      city_id: city.id,
      area: pick(cityAreas, index),
      category_id: categoryRow.id,
      gender,
      age: 18 + (index % 43),
      availability: `${availabilityTime.replace("_", " ")}, ${availabilityDays.replace("_", " ")}`,
      availability_time: availabilityTime,
      availability_days: availabilityDays,
      years_experience: years,
      experience: `${years} years ${category.name.toLowerCase()} experience`,
      expected_rate: `Rs. ${rate}/hour`,
      tagline: tagline(category.name, index),
      short_bio: `${qaPrefix} stress worker for ${category.name} in ${cityName}. Safe to delete after MVP testing.`,
      cnic: null,
      profile_photo_url: null,
      password_hash: passwordHash,
      secret_question: "What is your test color?",
      secret_answer_hash: secretAnswerHash,
      is_phone_verified: index % 3 !== 0,
      is_cnic_verified: index % 4 === 0,
      rating: Number((4 + (index % 10) / 10).toFixed(1)),
      is_active: true,
      is_featured: index % 20 === 0,
      featured_until: index % 20 === 0
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    if (hasPhoneNormalized) {
      row.phone_normalized = phone;
    }

    return row;
  });

  await insertBatches("professionals", rows, "id");
  return { requested: total, canonicalCategories: canonicalCategories.length };
}

async function createStaff({ companies, weightedCategories, total }) {
  const rows = Array.from({ length: total }, (_, index) => {
    const category = pick(weightedCategories, index + 17);
    const company = pick(companies, index);
    const [cityName, cityAreas] = pick(cities, index + 3);
    const gender = genderFor(category.name, index);
    const rate = hourlyRate(category.name, index + 4);
    const companyIndex = companies.findIndex((item) => item.id === company.id);
    const staffIndexForCompany = Math.floor(index / Math.max(1, companies.length));
    const isFeatured = staffIndexForCompany < 5;

    return {
      company_id: company.id,
      title: `${qaPrefix} Stress Staff ${category.name} ${index + 1} ${runId}`,
      service_group: category.serviceGroup,
      category: category.name,
      city: cityName,
      area: pick(cityAreas, index),
      description: `${qaPrefix} stress company-managed ${category.name.toLowerCase()} profile. Safe to delete after MVP testing.`,
      hourly_rate: rate,
      monthly_rate: null,
      profile_photo_url: null,
      tagline: tagline(category.name, index + 11),
      gender,
      age: 18 + ((index + 5) % 43),
      availability: pick(["Morning, weekdays", "Evening, weekdays", "Full Time, 7 days"], index),
      years_experience: 1 + ((index + 3) % 18),
      phone: company.phone ?? qaMobile(800000 + companyIndex),
      whatsapp: company.whatsapp ?? qaMobile(800000 + companyIndex),
      status: "approved",
      is_featured: isFeatured,
    };
  });

  await insertBatches("company_listings", rows, "id");
  return { requested: total };
}

async function main() {
  if (!Number.isFinite(totalTarget) || totalTarget < 1) {
    throw new Error("KAMKER_QA_STRESS_TOTAL must be a positive number.");
  }

  const canonicalCategories = readCanonicalCategories();
  const weightedCategories = weightedCategoryList(canonicalCategories);
  const workerTotal = Math.round(totalTarget * workerRatio);
  const staffTotal = totalTarget - workerTotal;

  if (dryRun) {
    const categoryDistribution = new Map();

    for (let index = 0; index < totalTarget; index += 1) {
      const category = pick(weightedCategories, index);
      categoryDistribution.set(category.name, (categoryDistribution.get(category.name) ?? 0) + 1);
    }

    logJson({
      ok: true,
      dryRun: true,
      runId,
      planned: {
        companies: companyCount,
        workers: workerTotal,
        companyStaff: staffTotal,
        totalProfiles: totalTarget,
        canonicalCategories: canonicalCategories.length,
      },
      topCategoryDistribution: Array.from(categoryDistribution.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([category, count]) => ({ category, count })),
    });
    return;
  }

  const { cityByName, categoryByName } = await loadLookups(canonicalCategories);
  const hasPhoneNormalized = await hasProfessionalPhoneNormalizedColumn();
  const companies = await createCompanies();
  const workers = await createWorkers({
    canonicalCategories,
    weightedCategories,
    cityByName,
    categoryByName,
    total: workerTotal,
    hasPhoneNormalized,
  });
  const staff = await createStaff({
    companies,
    weightedCategories,
    total: staffTotal,
  });

  logJson({
    ok: true,
    runId,
    created: {
      companies: companies.length,
      workers: workers.requested,
      companyStaff: staff.requested,
      totalProfiles: workers.requested + staff.requested,
    },
    notes: [
      "All records use Admin Test prefixes.",
      "Company staff featured profiles are capped to 5 per company for starter-package behavior.",
      "Security attack payloads are intentionally not seeded into production.",
      hasPhoneNormalized
        ? "professionals.phone_normalized is present and populated."
        : "professionals.phone_normalized is missing in production; stress workers were seeded without that column.",
    ],
    nextChecks: [
      "/professionals?q=nurse&city=Karachi",
      "/professionals?category=Actors%2FModels&city=Lahore",
      "/professionals?category=Drivers&city=Peshawar&age=26-35",
      "/categories/nurses",
      "/categories/actors-models",
      "/admin/analytics?category=Actors%2FModels&range=today",
    ],
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
