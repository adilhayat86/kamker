import { logJson } from "./qa-utils.mjs";
import {
  readCanonicalMarketplace,
  safeRows,
  sampleLike,
} from "./sample-data-utils.mjs";

async function main() {
  const { categories } = readCanonicalMarketplace();
  const [categoryRows, professionals, companyStaff, companies] = await Promise.all([
    safeRows("categories?select=id,name"),
    safeRows(
      `professionals?select=id,full_name,category_id,is_active,profile_photo_url&full_name=like.${sampleLike}`,
    ),
    safeRows(
      `company_listings?select=id,title,category,company_id,status,is_featured,profile_photo_url&title=like.${sampleLike}`,
    ),
    safeRows(`companies?select=id,company_name,category&company_name=like.${sampleLike}`),
  ]);
  const categoryNameById = new Map(categoryRows.map((row) => [row.id, row.name]));
  const professionalCounts = new Map();
  const staffCounts = new Map();
  const staffFeaturedByCompany = new Map();

  for (const professional of professionals) {
    const categoryName = categoryNameById.get(professional.category_id);
    if (categoryName && professional.is_active) {
      professionalCounts.set(categoryName, (professionalCounts.get(categoryName) ?? 0) + 1);
    }
  }

  for (const staff of companyStaff) {
    if (staff.status === "approved") {
      staffCounts.set(staff.category, (staffCounts.get(staff.category) ?? 0) + 1);
    }

    if (staff.is_featured) {
      staffFeaturedByCompany.set(
        staff.company_id,
        (staffFeaturedByCompany.get(staff.company_id) ?? 0) + 1,
      );
    }
  }

  const missingCoverage = categories
    .map((category) => ({
      category: category.name,
      sampleWorkers: professionalCounts.get(category.name) ?? 0,
      sampleCompanyStaff: staffCounts.get(category.name) ?? 0,
    }))
    .filter((row) => row.sampleWorkers < 3 || row.sampleCompanyStaff < 1);
  const companiesOverFeaturedLimit = [...staffFeaturedByCompany.entries()]
    .filter(([, count]) => count > 5)
    .map(([companyId, featuredCount]) => ({ companyId, featuredCount }));

  logJson({
    ok: missingCoverage.length === 0 && companiesOverFeaturedLimit.length === 0,
    totals: {
      sampleCompanies: companies.length,
      sampleWorkers: professionals.length,
      sampleCompanyStaff: companyStaff.length,
      categoriesChecked: categories.length,
    },
    missingCoverage,
    companiesOverFeaturedLimit,
    notes: [
      "Expected coverage is at least 3 sample individual workers and 1 approved company-managed staff profile per public subcategory.",
      "Company staff featured count is expected to stay at or below 5 per sample company.",
    ],
  });

  if (missingCoverage.length > 0 || companiesOverFeaturedLimit.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
