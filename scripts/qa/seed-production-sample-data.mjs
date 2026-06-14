import crypto from "node:crypto";

import { logJson, supabaseRest } from "./qa-utils.mjs";
import {
  insertBatches,
  pick,
  readCanonicalMarketplace,
  sampleCities,
  sampleContactPhone,
  samplePhotos,
  samplePrefix,
  slugify,
} from "./sample-data-utils.mjs";

const confirmText = "CREATE_SAMPLE_DATA";
const shouldExecute = process.env.KAMKER_SAMPLE_SEED_CONFIRM === confirmText;
const workersPerCategory = Number(process.env.KAMKER_SAMPLE_WORKERS_PER_CATEGORY ?? 3);

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

const availabilityTimes = ["morning", "evening", "full_time"];
const availabilityDays = ["weekdays", "weekend", "seven_days"];

async function main() {
  const marketplace = readCanonicalMarketplace();
  const planned = {
    serviceGroups: marketplace.serviceGroups.length,
    subcategories: marketplace.categories.length,
    sampleCompanies: marketplace.serviceGroups.length,
    sampleWorkers: marketplace.categories.length * workersPerCategory,
    sampleCompanyStaff: marketplace.categories.length,
  };

  if (!shouldExecute) {
    logJson({
      ok: true,
      mode: "dry-run",
      safety: `Dry run only. Set KAMKER_SAMPLE_SEED_CONFIRM=${confirmText} to create sample data.`,
      planned,
      contactSafety: [
        "Individual sample workers use no public call number.",
        `Sample WhatsApp contact is ${sampleContactPhone}. Override with KAMKER_SAMPLE_CONTACT_PHONE if needed.`,
        "All sample names start with Sample Data.",
      ],
    });
    return;
  }

  const lookups = await ensureTaxonomy(marketplace);
  const companies = await createCompanies(marketplace.serviceGroups);
  const subscriptions = await createSubscriptions(companies);
  const workers = await createWorkers(marketplace.categories, lookups);
  const staff = await createCompanyStaff(marketplace, companies);

  logJson({
    ok: true,
    mode: "execute",
    created: {
      companies: companies.length,
      subscriptions: subscriptions.length,
      workers: workers.length,
      companyStaff: staff.length,
    },
    samplePrefix,
    cleanup: "Run npm run sample:cleanup-production with KAMKER_SAMPLE_CLEANUP_CONFIRM=DELETE_SAMPLE_DATA to remove only sample rows later.",
    checks: [
      "https://kamker.com/categories/healthcare",
      "https://kamker.com/categories/nurses",
      "https://kamker.com/categories/babysitters",
      "https://kamker.com/professionals?q=maid&city=Quetta",
    ],
  });
}

async function ensureTaxonomy({ categories, serviceGroups }) {
  const groupRows = await upsertRows(
    "categories",
    serviceGroups.map((group, index) => ({
      name: group.name,
      slug: group.slug,
      icon: "FolderOpen",
      description: group.description,
      sort_order: index + 1,
    })),
    "slug",
    "id,name,slug",
  );
  const groupByName = new Map(groupRows.map((row) => [row.name, row]));

  const categoryRows = await upsertRows(
    "categories",
    categories.map((category, index) => ({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: `Find ${category.name.toLowerCase()} by city on Kamker.`,
      parent_id: groupByName.get(category.serviceGroup)?.id ?? null,
      sort_order: index + 1,
    })),
    "slug",
    "id,name,slug",
  );

  const cityRows = await upsertRows(
    "cities",
    sampleCities.map(([name]) => ({ name })),
    "name",
    "id,name",
  );

  return {
    categoryByName: new Map(categoryRows.map((row) => [row.name, row])),
    cityByName: new Map(cityRows.map((row) => [row.name, row])),
  };
}

async function upsertRows(table, rows, conflictColumn, select) {
  return supabaseRest(`${table}?on_conflict=${conflictColumn}&select=${select}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows),
  });
}

async function createCompanies(serviceGroups) {
  const rows = serviceGroups.map((group, index) => {
    const [cityName, areas] = pick(sampleCities, index);

    return {
      owner_user_id: crypto.randomUUID(),
      company_name: `${samplePrefix} Company ${group.name}`,
      category: group.name,
      city: cityName,
      area: pick(areas, index),
      contact_person: `${samplePrefix} Company Owner`,
      phone: sampleContactPhone,
      whatsapp: sampleContactPhone,
      description: `${samplePrefix} verified company profile for ${group.name}. This soft-launch sample can be deleted later.`,
      license_number: `SAMPLE-${slugify(group.name).toUpperCase()}`,
      logo_url: "/kamker-logo-old-wordmark.png",
      verification_status: "verified",
      payment_status: "paid",
    };
  });

  return insertBatches("companies", rows, "id,company_name,category,phone,whatsapp");
}

async function createSubscriptions(companies) {
  const packages = await supabaseRest(
    "company_packages?select=id,package_key,listings_limit,featured_limit,duration_days&package_key=eq.company_starter_monthly&limit=1",
  );
  const companyPackage = packages[0];

  if (!companyPackage) {
    throw new Error("Missing company_starter_monthly package.");
  }

  const startsAt = new Date();
  const expiresAt = new Date(
    startsAt.getTime() + companyPackage.duration_days * 24 * 60 * 60 * 1000,
  );
  const rows = companies.map((company) => ({
    company_id: company.id,
    package_id: companyPackage.id,
    manual_payment_id: null,
    package_key: companyPackage.package_key,
    listings_limit: companyPackage.listings_limit,
    featured_limit: companyPackage.featured_limit,
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: "active",
  }));

  return insertBatches("company_package_subscriptions", rows, "id,company_id");
}

async function createWorkers(categories, { categoryByName, cityByName }) {
  const rows = [];

  categories.forEach((category, categoryIndex) => {
    for (let slot = 0; slot < workersPerCategory; slot += 1) {
      const cityTuple = pick(sampleCities, categoryIndex + slot);
      const [cityName, areas] = cityTuple;
      const gender = genderFor(category.name, slot);
      const years = 2 + ((categoryIndex + slot) % 9);
      const rate = hourlyRate(category.name, slot);

      rows.push({
        full_name: `${samplePrefix} Worker ${category.name} ${slot + 1}`,
        phone_number: null,
        phone_normalized: null,
        whatsapp_number: sampleContactPhone,
        city_id: cityByName.get(cityName)?.id,
        area: pick(areas, slot),
        category_id: categoryByName.get(category.name)?.id,
        gender,
        age: 21 + ((categoryIndex + slot) % 34),
        availability: availabilityLabel(slot),
        availability_time: pick(availabilityTimes, slot),
        availability_days: pick(availabilityDays, categoryIndex + slot),
        years_experience: years,
        experience: `${years} years`,
        expected_rate: `Rs. ${rate}/hour`,
        tagline: tagline(category.name, slot),
        short_bio: `${samplePrefix} profile for ${category.name}. This is launch filler and can be deleted later.`,
        cnic: null,
        profile_photo_url: pick(samplePhotos, categoryIndex + slot),
        password_hash: null,
        secret_question: null,
        secret_answer_hash: null,
        is_phone_verified: false,
        is_cnic_verified: false,
        rating: Number((4.2 + (slot * 0.2)).toFixed(1)),
        is_active: true,
        is_featured: slot === 0 && categoryIndex % 8 === 0,
        featured_until:
          slot === 0 && categoryIndex % 8 === 0
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null,
      });
    }
  });

  return insertBatches("professionals", rows, "id,full_name");
}

async function createCompanyStaff({ categories, serviceGroups }, companies) {
  const companyByGroup = new Map(companies.map((company) => [company.category, company]));
  const featuredUsedByCompany = new Map();
  const rows = categories.map((category, index) => {
    const company = companyByGroup.get(category.serviceGroup) ?? pick(companies, index);
    const [cityName, areas] = pick(sampleCities, index + 2);
    const usedFeatured = featuredUsedByCompany.get(company.id) ?? 0;
    const isFeatured = usedFeatured < 5;

    if (isFeatured) {
      featuredUsedByCompany.set(company.id, usedFeatured + 1);
    }

    return {
      company_id: company.id,
      title: `${samplePrefix} Staff ${category.name}`,
      service_group: category.serviceGroup,
      category: category.name,
      city: cityName,
      area: pick(areas, index),
      description: `${samplePrefix} company-managed staff profile for ${category.name}. Owned by ${company.company_name}.`,
      hourly_rate: hourlyRate(category.name, index + 1),
      monthly_rate: null,
      profile_photo_url: pick(samplePhotos, index + 3),
      tagline: tagline(category.name, index + 1),
      gender: genderFor(category.name, index),
      age: 23 + (index % 31),
      availability: availabilityLabel(index),
      years_experience: 2 + (index % 10),
      phone: sampleContactPhone,
      whatsapp: sampleContactPhone,
      is_featured: isFeatured,
      status: "approved",
    };
  });

  if (serviceGroups.length !== companies.length) {
    throw new Error("Sample company coverage does not match service group count.");
  }

  return insertBatches("company_listings", rows, "id,title,company_id");
}

function genderFor(categoryName, index) {
  if (femalePreferred.has(categoryName)) {
    return index % 4 === 0 ? "Male" : "Female";
  }

  if (malePreferred.has(categoryName)) {
    return index % 5 === 0 ? "Female" : "Male";
  }

  return index % 2 === 0 ? "Female" : "Male";
}

function hourlyRate(categoryName, index) {
  const lower = categoryName.toLowerCase();
  const base = lower.includes("consultant") || lower.includes("developer")
    ? 1800
    : lower.includes("nurse") || lower.includes("technician") || lower.includes("mechanic")
      ? 900
      : lower.includes("driver") || lower.includes("maid") || lower.includes("cleaner")
        ? 450
        : 650;

  return base + ((index % 4) * 150);
}

function tagline(categoryName, index) {
  const phrases = [
    `Sample ${categoryName}`.slice(0, 30),
    "Verified sample profile",
    "Available in your city",
    "Direct WhatsApp contact",
  ];

  return pick(phrases, index).slice(0, 30);
}

function availabilityLabel(index) {
  return pick(
    ["Morning, weekdays", "Evening, weekend", "Full Time, 7 days"],
    index,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
