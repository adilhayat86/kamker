import crypto from "node:crypto";
import fs from "node:fs";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);

export const qaPrefix = "Admin Test";
export const defaultBaseUrl = "https://kamker.vercel.app";

export function loadEnvFile(path = ".env.local") {
  if (!fs.existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index);
        const value = line.slice(index + 1).replace(/^['"]|['"]$/g, "");

        return [key, value];
      }),
  );
}

export function productionConfig() {
  const env = { ...loadEnvFile(), ...process.env };
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const baseUrl = env.KAMKER_QA_BASE_URL || defaultBaseUrl;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    supabaseAnonKey,
  };
}

export function restHeaders(extra = {}) {
  const { supabaseAnonKey } = productionConfig();

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export async function supabaseRest(path, options = {}) {
  const { supabaseUrl } = productionConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: restHeaders(options.headers ?? {}),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} ${response.status}: ${text.slice(0, 800)}`,
    );
  }

  return text ? JSON.parse(text) : null;
}

export async function supabaseRestResponse(path, options = {}) {
  const { supabaseUrl } = productionConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: restHeaders(options.headers ?? {}),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} ${response.status}: ${text.slice(0, 800)}`,
    );
  }

  return {
    response,
    data: text ? JSON.parse(text) : null,
  };
}

export async function supabaseExactCount(table, filters = "") {
  const suffix = filters ? `&${filters}` : "";
  const { response } = await supabaseRestResponse(`${table}?select=id${suffix}`, {
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const range = response.headers.get("content-range");
  const countText = range?.split("/")?.[1];

  return countText && countText !== "*" ? Number(countText) : null;
}

export async function firstRow(table, query) {
  const rows = await supabaseRest(`${table}?${query}&limit=1`);

  return rows?.[0] ?? null;
}

export async function hashSecret(value) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const key = await scrypt(value, salt, 64);

  return `scrypt:${salt}:${Buffer.from(key).toString("base64url")}`;
}

export function qaPhone(prefix, stamp) {
  return `+923${prefix}${String(stamp).slice(-7)}`;
}

export function logJson(value) {
  console.log(JSON.stringify(value, null, 2));
}
