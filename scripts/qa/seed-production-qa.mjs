import crypto from "node:crypto";

import {
  firstRow,
  hashSecret,
  logJson,
  qaPhone,
  qaPrefix,
  supabaseRest,
} from "./qa-utils.mjs";

async function main() {
  const stamp = Date.now();
  const city = await firstRow("cities", "select=id,name&name=eq.Karachi");
  const nurseCategory = await firstRow(
    "categories",
    "select=id,name&name=eq.Nurses",
  );

  if (!city || !nurseCategory) {
    throw new Error("Missing Karachi city or Nurses category in Supabase.");
  }

  const worker = await createWorker(stamp, city.id, nurseCategory.id);
  const requirement = await createRequirement(stamp, city.id);
  await createRequirementMatch(requirement.id, worker.id);
  const company = await createCompany(stamp);
  const staff = await createCompanyStaff(stamp, company.id);

  logJson({
    ok: true,
    created: {
      worker,
      requirement,
      company,
      staff,
    },
    nextChecks: [
      "/professionals?q=nurse&city=Karachi",
      `/professionals/${worker.id}`,
      `/companies/${company.id}`,
      `/company-listings/${staff[0].id}`,
      `/admin/requirements/${requirement.id}`,
    ],
  });
}

async function createWorker(stamp, cityId, categoryId) {
  const payload = {
    full_name: `${qaPrefix} Worker Nurse ${stamp}`,
    phone_number: qaPhone("10", stamp),
    whatsapp_number: qaPhone("10", stamp),
    city_id: cityId,
    area: "Karachi Test Area",
    category_id: categoryId,
    gender: "Female",
    age: 29,
    availability: "Morning, Weekdays",
    availability_time: "morning",
    availability_days: "weekdays",
    years_experience: 5,
    experience: "Admin Test 5 years home nursing",
    expected_rate: "Rs. 900/hour",
    tagline: "Caring nurse at home",
    short_bio:
      "Admin Test Worker production QA record. Safe to delete after MVP testing.",
    cnic: "Admin Test CNIC",
    profile_photo_url: null,
    password_hash: await hashSecret("TestPass123!"),
    secret_question: "What is your test color?",
    secret_answer_hash: await hashSecret("blue"),
    is_phone_verified: false,
    is_cnic_verified: false,
    is_active: true,
    is_featured: true,
    featured_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const [worker] = await supabaseRest(
    "professionals?select=id,full_name,phone_number",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );

  return worker;
}

async function createRequirement(stamp, cityId) {
  const [requirement] = await supabaseRest(
    "requirements?select=id,required_service,city_id",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        required_service: "Nurses",
        city_id: cityId,
        area: "Karachi Test Area",
        availability: "Morning",
        details: `${qaPrefix} Requirement Nurse ${stamp}. Need home nurse for QA.`,
        budget: "Rs. 1000/hour",
        phone_number: qaPhone("11", stamp),
        whatsapp_number: qaPhone("11", stamp),
        urgency: "Today",
        broadcast_status: "pending_payment",
        status: "open",
      }),
    },
  );

  return requirement;
}

async function createRequirementMatch(requirementId, professionalId) {
  await supabaseRest("requirement_matches", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      requirement_id: requirementId,
      professional_id: professionalId,
      match_score: 95,
    }),
  });
}

async function createCompany(stamp) {
  const [company] = await supabaseRest("companies?select=id,company_name", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      owner_user_id: crypto.randomUUID(),
      company_name: `${qaPrefix} Company Care ${stamp}`,
      category: "Healthcare",
      city: "Karachi",
      area: "Karachi Test Area",
      contact_person: "Admin Test Owner",
      phone: qaPhone("12", stamp),
      whatsapp: qaPhone("12", stamp),
      description:
        "Admin Test Company production QA record. Safe to delete after MVP testing.",
      license_number: `ADMIN-TEST-${String(stamp).slice(-7)}`,
      verification_status: "verified",
      payment_status: "paid",
    }),
  });

  return company;
}

async function createCompanyStaff(stamp, companyId) {
  return supabaseRest(
    "company_listings?select=id,title,city,category,is_featured",
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([
        {
          company_id: companyId,
          title: `${qaPrefix} Staff Nurse Karachi ${stamp}`,
          service_group: "Healthcare",
          category: "Nurses",
          city: "Karachi",
          area: "Karachi Test Area",
          description: "Admin Test Staff company-managed nurse in Karachi.",
          hourly_rate: 950,
          monthly_rate: null,
          profile_photo_url: null,
          tagline: "Company home nurse",
          gender: "Female",
          age: 31,
          availability: "Full Time, 7 days a week",
          years_experience: 6,
          phone: qaPhone("12", stamp),
          whatsapp: qaPhone("12", stamp),
          status: "approved",
          is_featured: true,
        },
        {
          company_id: companyId,
          title: `${qaPrefix} Staff Driver Lahore ${stamp}`,
          service_group: "Transport & Security",
          category: "Drivers",
          city: "Lahore",
          area: "DHA Test Area",
          description: "Admin Test Staff company-managed driver in Lahore.",
          hourly_rate: 700,
          monthly_rate: null,
          profile_photo_url: null,
          tagline: "Careful city driver",
          gender: "Male",
          age: 38,
          availability: "Morning, Weekdays",
          years_experience: 10,
          phone: qaPhone("12", stamp),
          whatsapp: qaPhone("12", stamp),
          status: "approved",
          is_featured: false,
        },
      ]),
    },
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
