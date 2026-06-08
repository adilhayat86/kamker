import { logJson, productionConfig, supabaseExactCount, supabaseRest } from "./qa-utils.mjs";

const checks = [
  {
    name: "professionals core profile columns",
    migration: "schema.sql",
    query:
      "professionals?select=id,full_name,phone_number,whatsapp_number,city_id,area,category_id,short_bio,is_active&limit=1",
  },
  {
    name: "professional login/session columns",
    migration: "custom phone login migration in schema.sql",
    query:
      "professionals?select=id,password_hash,secret_question,secret_answer_hash&limit=1",
  },
  {
    name: "professional photo and conversion fields",
    migration: "sql/20260604_photos_and_analytics.sql and sql/20260606_professional_photo_limit.sql",
    query:
      "professionals?select=id,profile_photo_url,tagline,gender,availability,availability_time,availability_days,years_experience,expected_rate&limit=1",
  },
  {
    name: "professional age",
    migration: "sql/20260606_worker_age.sql",
    query: "professionals?select=id,age&limit=1",
  },
  {
    name: "professional phone ownership rules",
    migration: "sql/20260608_phone_ownership_rules.sql",
    query: "professionals?select=id,phone_normalized&limit=1",
    required: true,
  },
  {
    name: "requirements and matching",
    migration: "schema.sql and requirement matching migrations",
    query:
      "requirements?select=id,required_service,city_id,area,urgency,status,broadcast_status,payment_status,created_at&limit=1",
  },
  {
    name: "requirement matches",
    migration: "schema.sql",
    query: "requirement_matches?select=id,requirement_id,professional_id,match_score&limit=1",
  },
  {
    name: "company accounts",
    migration: "sql/20260604_company_professional_listings.sql",
    query:
      "companies?select=id,company_name,phone,whatsapp,city,area,category,logo_url,verification_status,payment_status&limit=1",
  },
  {
    name: "company packages and subscriptions",
    migration: "sql/20260604_company_professional_listings.sql",
    query:
      "company_package_subscriptions?select=id,company_id,package_id,status,listings_limit,featured_limit,expires_at&limit=1",
  },
  {
    name: "company staff profiles",
    migration: "sql/20260604_company_professional_listings.sql and later staff migrations",
    query:
      "company_listings?select=id,company_id,title,service_group,category,city,area,status,is_featured,profile_photo_url,tagline,gender,availability,years_experience,hourly_rate,monthly_rate,age&limit=1",
  },
  {
    name: "company media",
    migration: "sql/20260605_company_profiles_media.sql",
    query: "company_media?select=id,company_id,url,media_type,caption,sort_order&limit=1",
  },
  {
    name: "proof reviews",
    migration: "sql/20260604_proof_reviews.sql",
    query:
      "proof_reviews?select=id,review_type,related_id,expected_amount_pkr,image_url,ai_decision,audit_status&limit=1",
  },
  {
    name: "analytics events",
    migration: "sql/20260604_photos_and_analytics.sql",
    query: "analytics_events?select=id,event_type,target_type,target_id,metadata,created_at&limit=1",
  },
  {
    name: "WhatsApp message log",
    migration: "sql/20260604_whatsapp_messages.sql",
    query: "whatsapp_messages?select=id,recipient_phone,message_type,status,provider_message_id,error_message,created_at&limit=1",
  },
  {
    name: "admin audit logs",
    migration: "sql/20260607_admin_audit_logs.sql",
    query: "admin_audit_logs?select=id,action,target_type,target_id,admin_label,metadata&limit=1",
  },
  {
    name: "admin password reset table",
    migration: "sql/20260607_admin_passwords.sql",
    query: "admin_password_resets?select=id,role,token_hash,expires_at,used_at&limit=1",
  },
  {
    name: "admin settings",
    migration: "schema.sql",
    query: "admin_settings?select=key,value,updated_at&limit=1",
  },
  {
    name: "categories",
    migration: "schema.sql and sql/20260608_canonical_categories.sql",
    query: "categories?select=id,name,slug,icon,description,parent_id,sort_order&limit=1",
  },
  {
    name: "cities",
    migration: "schema.sql",
    query: "cities?select=id,name,created_at&limit=1",
  },
  {
    name: "professional sessions",
    migration: "custom professional login session migration in schema.sql",
    query: "professional_sessions?select=id,professional_id,session_token_hash,expires_at&limit=1",
  },
];

async function main() {
  const { supabaseUrl } = productionConfig();
  const results = await Promise.all(checks.map(runCheck));
  const qaCounts = await getQaCounts();
  const failures = results.filter((result) => !result.ok);
  const requiredFailures = failures.filter((result) => result.required);
  const migrationHelp = buildMigrationHelp(failures, supabaseUrl);

  logJson({
    ok: failures.length === 0,
    deployReady: requiredFailures.length === 0,
    note:
      failures.length === 0
        ? "Production schema matches the app-facing checks."
        : "Apply the listed migrations in Supabase SQL Editor, then rerun this command.",
    requiredFailures: requiredFailures.map((failure) => failure.name),
    missingOrBrokenChecks: failures,
    migrationHelp,
    qaCounts,
    results,
  });

  if (requiredFailures.length > 0) {
    process.exitCode = 1;
  }
}

function buildMigrationHelp(failures, supabaseUrl) {
  if (failures.length === 0) {
    return {
      needed: false,
      message: "No schema migration help needed.",
    };
  }

  const missingNames = failures.map((failure) => failure.name);
  const phoneOnly =
    failures.length === 1 && missingNames.includes("professional phone ownership rules");
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  return {
    needed: true,
    command: phoneOnly ? "npm run qa:copy-phone-sql" : "npm run qa:copy-supabase-sql",
    sqlFile: "tmp/kamker-mvp-production.sql",
    supabaseSqlEditorUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
    message: phoneOnly
      ? "Only the phone ownership migration is missing. Generate/copy the phone-only SQL bundle, paste it into Supabase SQL Editor, run it, then rerun npm run qa:mvp-readiness."
      : "One or more production schema checks are missing. Generate/copy the full SQL bundle, paste it into Supabase SQL Editor, run it, then rerun npm run qa:mvp-readiness.",
  };
}

async function runCheck(check) {
  try {
    await supabaseRest(check.query);

    return {
      name: check.name,
      ok: true,
      required: Boolean(check.required),
      migration: check.migration,
    };
  } catch (error) {
    return {
      name: check.name,
      ok: false,
      required: Boolean(check.required),
      migration: check.migration,
      error: error.message,
    };
  }
}

async function getQaCounts() {
  try {
    const [professionals, companies, companyListings, requirements] = await Promise.all([
      supabaseExactCount("professionals", "full_name=like.Admin%20Test*"),
      supabaseExactCount("companies", "company_name=like.Admin%20Test*"),
      supabaseExactCount("company_listings", "title=like.Admin%20Test*"),
      supabaseExactCount("requirements", "details=like.Admin%20Test*"),
    ]);

    return {
      professionals,
      companies,
      companyListings,
      requirements,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
