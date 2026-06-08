import { logJson, supabaseRestAll } from "./qa-utils.mjs";

async function main() {
  const [subscriptions, listings] = await Promise.all([
    supabaseRestAll(
      "company_package_subscriptions?select=id,company_id,package_key,status,listings_limit,featured_limit,expires_at&status=eq.active&order=expires_at.desc",
    ),
    supabaseRestAll(
      "company_listings?select=id,company_id,title,status,is_featured&status=eq.approved",
    ),
  ]);
  const activeByCompany = latestActiveSubscriptionByCompany(subscriptions);
  const usageByCompany = usageByCompanyId(listings);
  const companiesWithoutPackages = [];
  const companiesOverPublishedLimit = [];
  const companiesOverFeaturedLimit = [];
  const qaCompaniesWithoutPackages = [];
  const qaCompaniesOverPublishedLimit = [];
  const qaCompaniesOverFeaturedLimit = [];
  let totalPublished = 0;
  let totalFeatured = 0;

  for (const [companyId, usage] of usageByCompany.entries()) {
    totalPublished += usage.published;
    totalFeatured += usage.featured;

    const subscription = activeByCompany.get(companyId);

    if (!subscription) {
      const target = usage.nonQaPublished > 0
        ? companiesWithoutPackages
        : qaCompaniesWithoutPackages;
      target.push({ companyId, ...usage });
      continue;
    }

    if (usage.published > subscription.listings_limit) {
      const target = usage.nonQaPublished > 0
        ? companiesOverPublishedLimit
        : qaCompaniesOverPublishedLimit;
      target.push({
        companyId,
        packageKey: subscription.package_key,
        published: usage.published,
        nonQaPublished: usage.nonQaPublished,
        listingsLimit: subscription.listings_limit,
      });
    }

    if (usage.featured > subscription.featured_limit) {
      const target = usage.nonQaFeatured > 0
        ? companiesOverFeaturedLimit
        : qaCompaniesOverFeaturedLimit;
      target.push({
        companyId,
        packageKey: subscription.package_key,
        featured: usage.featured,
        nonQaFeatured: usage.nonQaFeatured,
        featuredLimit: subscription.featured_limit,
      });
    }
  }

  const ok =
    companiesOverPublishedLimit.length === 0 &&
    companiesOverFeaturedLimit.length === 0;

  logJson({
    ok,
    summary: {
      activeSubscriptions: activeByCompany.size,
      companiesWithApprovedStaff: usageByCompany.size,
      approvedCompanyStaff: totalPublished,
      featuredCompanyStaff: totalFeatured,
      featuredShare:
        totalPublished > 0 ? Number((totalFeatured / totalPublished).toFixed(4)) : 0,
      companiesWithoutActivePackages: companiesWithoutPackages.length,
      companiesOverPublishedLimit: companiesOverPublishedLimit.length,
      companiesOverFeaturedLimit: companiesOverFeaturedLimit.length,
      qaCompaniesWithoutActivePackages: qaCompaniesWithoutPackages.length,
      qaCompaniesOverPublishedLimit: qaCompaniesOverPublishedLimit.length,
      qaCompaniesOverFeaturedLimit: qaCompaniesOverFeaturedLimit.length,
    },
    companiesWithoutPackages: companiesWithoutPackages.slice(0, 20),
    companiesOverPublishedLimit: companiesOverPublishedLimit.slice(0, 20),
    companiesOverFeaturedLimit: companiesOverFeaturedLimit.slice(0, 20),
    qaWarnings: {
      companiesWithoutPackages: qaCompaniesWithoutPackages.slice(0, 20),
      companiesOverPublishedLimit: qaCompaniesOverPublishedLimit.slice(0, 20),
      companiesOverFeaturedLimit: qaCompaniesOverFeaturedLimit.slice(0, 20),
    },
    note: ok
      ? "Non-test company staff featured/listing usage respects active package limits. Admin Test stress data may intentionally exceed published limits for search testing."
      : "Fix company staff/package usage before considering company marketplace MVP-ready.",
  });

  if (!ok) {
    process.exitCode = 1;
  }
}

function latestActiveSubscriptionByCompany(subscriptions) {
  const now = Date.now();
  const active = new Map();

  for (const subscription of subscriptions) {
    const expiresAt = subscription.expires_at
      ? new Date(subscription.expires_at).getTime()
      : 0;

    if (expiresAt <= now) {
      continue;
    }

    const current = active.get(subscription.company_id);
    const currentExpiresAt = current?.expires_at
      ? new Date(current.expires_at).getTime()
      : 0;

    if (!current || expiresAt > currentExpiresAt) {
      active.set(subscription.company_id, subscription);
    }
  }

  return active;
}

function usageByCompanyId(listings) {
  const usage = new Map();

  for (const listing of listings) {
    const current = usage.get(listing.company_id) ?? {
      published: 0,
      featured: 0,
      qaPublished: 0,
      qaFeatured: 0,
      nonQaPublished: 0,
      nonQaFeatured: 0,
      examples: [],
    };
    const isQa = (listing.title ?? "").startsWith("Admin Test");

    current.published += 1;
    current.featured += listing.is_featured ? 1 : 0;
    current.qaPublished += isQa ? 1 : 0;
    current.qaFeatured += isQa && listing.is_featured ? 1 : 0;
    current.nonQaPublished += isQa ? 0 : 1;
    current.nonQaFeatured += !isQa && listing.is_featured ? 1 : 0;

    if (current.examples.length < 3) {
      current.examples.push({
        id: listing.id,
        title: listing.title,
        featured: listing.is_featured,
      });
    }

    usage.set(listing.company_id, current);
  }

  return usage;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
