import fs from "node:fs";

import { supabaseRest, supabaseRestAll } from "./qa-utils.mjs";

export const samplePrefix = "Sample Data";
export const sampleLike = "Sample%20Data*";
export const sampleContactPhone = process.env.KAMKER_SAMPLE_CONTACT_PHONE ?? "+923005314191";
export const samplePhotos = [
  "/avatars/pro-1.svg",
  "/avatars/pro-2.svg",
  "/avatars/pro-3.svg",
  "/avatars/pro-4.svg",
  "/avatars/pro-5.svg",
  "/avatars/pro-6.svg",
];

export const sampleCities = [
  ["Karachi", ["Gulshan-e-Iqbal", "North Nazimabad", "DHA", "Saddar"]],
  ["Lahore", ["Johar Town", "Model Town", "Gulberg", "DHA"]],
  ["Islamabad", ["G-10", "F-8", "I-8", "Blue Area"]],
  ["Rawalpindi", ["Saddar", "Bahria Town", "Satellite Town", "Chaklala"]],
  ["Peshawar", ["Hayatabad", "University Town", "Saddar", "Gulbahar"]],
  ["Quetta", ["Cantt", "Satellite Town", "Jinnah Town", "Brewery Road"]],
  ["Faisalabad", ["D Ground", "Madina Town", "People Colony", "Jinnah Colony"]],
  ["Multan", ["Gulgasht", "Cantt", "New Multan", "Shah Rukn-e-Alam"]],
  ["Hyderabad", ["Latifabad", "Qasimabad", "Saddar", "Auto Bhan"]],
  ["Sialkot", ["Cantt", "Model Town", "Daska Road", "Paris Road"]],
];

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readCanonicalMarketplace() {
  const source = fs.readFileSync("src/lib/marketplace-data.ts", "utf8");
  const categoryBlock = source.match(/export const categories = \[([\s\S]*?)\];/);
  const groupBlock = source.match(/export const serviceGroups: ServiceGroup\[] = \[([\s\S]*?)\];/);

  if (!categoryBlock || !groupBlock) {
    throw new Error("Could not parse canonical marketplace data.");
  }

  const categories = [...categoryBlock[1].matchAll(/\{\s*name:\s*"([^"]+)",\s*icon:\s*"([^"]+)"/g)].map(
    (match) => ({ name: match[1], icon: match[2], slug: slugify(match[1]) }),
  );
  const serviceGroups = [];
  const categoryToGroup = new Map();

  for (const groupMatch of groupBlock[1].matchAll(
    /\{\s*name:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"[\s\S]*?subcategories:\s*\[([^\]]+)\]/g,
  )) {
    const group = {
      name: groupMatch[1],
      slug: slugify(groupMatch[1]),
      description: groupMatch[2],
      subcategories: [...groupMatch[3].matchAll(/"([^"]+)"/g)].map((match) => match[1]),
    };
    serviceGroups.push(group);
    group.subcategories.forEach((subcategory) => categoryToGroup.set(subcategory, group.name));
  }

  return {
    categories: categories.map((category) => ({
      ...category,
      serviceGroup: categoryToGroup.get(category.name) ?? "Other",
    })),
    serviceGroups,
  };
}

export function pick(items, index) {
  return items[index % items.length];
}

export function chunks(values, size = 80) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }

  return result;
}

export function uniqueRows(rows) {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

export async function safeRows(path) {
  try {
    return await supabaseRestAll(path);
  } catch {
    return [];
  }
}

export async function safeDeleteByIds(table, rows, shouldExecute) {
  const unique = uniqueRows(rows);

  if (!shouldExecute) {
    return { table, matched: unique.length, deleted: 0 };
  }

  let deleted = 0;
  for (const chunk of chunks(unique.map((row) => row.id))) {
    await supabaseRest(`${table}?id=in.(${chunk.join(",")})`, { method: "DELETE" });
    deleted += chunk.length;
  }

  return { table, matched: unique.length, deleted };
}

export async function rowsByAnyFilter(table, columns, ids) {
  if (!ids.length) {
    return [];
  }

  const rows = [];
  for (const column of columns) {
    for (const chunk of chunks(ids)) {
      rows.push(...(await safeRows(`${table}?select=id&${column}=in.(${chunk.join(",")})`)));
    }
  }

  return uniqueRows(rows);
}

export async function insertBatches(table, rows, select = "id", batchSize = 100) {
  const created = [];

  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const result = await supabaseRest(`${table}?select=${select}`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(batch),
    });

    created.push(...result);
  }

  return created;
}
