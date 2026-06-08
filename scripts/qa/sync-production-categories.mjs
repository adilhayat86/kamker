import fs from "node:fs";

import { logJson, supabaseRest } from "./qa-utils.mjs";

function slug(name) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseMarketplaceData() {
  const source = fs.readFileSync("src/lib/marketplace-data.ts", "utf8");
  const categoryBlock = source.match(/export const categories = \[([\s\S]*?)\];/);
  const groupBlock = source.match(/export const serviceGroups: ServiceGroup\[] = \[([\s\S]*?)\];/);

  if (!categoryBlock || !groupBlock) {
    throw new Error("Could not parse canonical marketplace data.");
  }

  const categories = [...categoryBlock[1].matchAll(/\{\s*name:\s*"([^"]+)",\s*icon:\s*"([^"]+)"/g)].map(
    (match) => ({ name: match[1], icon: match[2] }),
  );
  const groups = [...groupBlock[1].matchAll(
    /\{\s*name:\s*"([^"]+)",\s*icon:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*subcategories:\s*\[([^\]]+)\]/g,
  )].map((match, index) => ({
    name: match[1],
    icon: match[2],
    description: match[3],
    sort_order: (index + 1) * 10,
    subcategories: [...match[4].matchAll(/"([^"]+)"/g)].map((subcategory) => subcategory[1]),
  }));

  return { categories, groups };
}

async function findCategoryByName(name) {
  const rows = await supabaseRest(`categories?select=id,name&name=eq.${encodeURIComponent(name)}&limit=1`);

  return rows[0] ?? null;
}

async function upsertCategory(payload) {
  const existing = await findCategoryByName(payload.name);

  if (existing) {
    await supabaseRest(`categories?id=eq.${existing.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });

    return { ...existing, action: "updated" };
  }

  const [created] = await supabaseRest("categories?select=id,name", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });

  return { ...created, action: "created" };
}

async function main() {
  const { categories, groups } = parseMarketplaceData();
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const summary = {
    groupsCreated: 0,
    groupsUpdated: 0,
    categoriesCreated: 0,
    categoriesUpdated: 0,
  };

  for (const group of groups) {
    const result = await upsertCategory({
      name: group.name,
      slug: slug(group.name),
      icon: group.icon,
      description: group.description,
      parent_id: null,
      sort_order: group.sort_order,
    });

    summary[result.action === "created" ? "groupsCreated" : "groupsUpdated"] += 1;

    for (const [subcategoryIndex, subcategoryName] of group.subcategories.entries()) {
      const category = categoryByName.get(subcategoryName);
      const childResult = await upsertCategory({
        name: subcategoryName,
        slug: slug(subcategoryName),
        icon: category?.icon ?? group.icon,
        description: `${subcategoryName} professionals listed on Kamker.`,
        parent_id: result.id,
        sort_order: (subcategoryIndex + 1) * 10,
      });

      summary[childResult.action === "created" ? "categoriesCreated" : "categoriesUpdated"] += 1;
    }
  }

  logJson({
    ok: true,
    summary,
    note: "Canonical categories synced. Old categories were not deleted.",
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
