import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { hashSecret, verifySecret } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const LEGACY_ADMIN_SESSION_COOKIE = "kamker_admin_session";
export const ADMIN_SESSION_COOKIE = "kamker_admin_session_v2";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const ADMIN_RESET_MAX_AGE_SECONDS = 60 * 15;
const OWNER_EMAIL = "adilhayat@yahoo.com";

export type AdminRole = "owner" | "manager";

type AdminPasswordRow = {
  role: AdminRole;
  password_hash: string;
};

type AdminResetRow = {
  id: string;
  role: AdminRole;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
};

function hasSigningSecret() {
  return Boolean(
    process.env.KAMKER_AUTH_SECRET ||
      (process.env.NODE_ENV !== "production" &&
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "kamker-local-development-secret")),
  );
}

function signingSecret() {
  if (process.env.KAMKER_AUTH_SECRET) {
    return process.env.KAMKER_AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    return "";
  }

  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "kamker-local-development-secret"
  );
}

function signValue(value: string) {
  return createHmac("sha256", signingSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function hashResetToken(token: string) {
  return createHmac("sha256", signingSecret()).update(`reset:${token}`).digest("hex");
}

function envPasswordForRole(role: AdminRole) {
  if (role === "owner") {
    return process.env.KAMKER_OWNER_ADMIN_PASSWORD || process.env.KAMKER_ADMIN_PASSWORD;
  }

  return process.env.KAMKER_MANAGER_ADMIN_PASSWORD;
}

async function passwordHashForRole(role: AdminRole) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_passwords")
    .select("role, password_hash")
    .eq("role", role)
    .maybeSingle();

  if (error) {
    console.error("Failed to load admin password override", error);
    return null;
  }

  return (data as AdminPasswordRow | null)?.password_hash ?? null;
}

export function isAdminPasswordConfigured() {
  return Boolean(
    hasSigningSecret() &&
      (process.env.KAMKER_OWNER_ADMIN_PASSWORD ||
        process.env.KAMKER_ADMIN_PASSWORD ||
        process.env.KAMKER_MANAGER_ADMIN_PASSWORD),
  );
}

export function adminOwnerEmail() {
  return OWNER_EMAIL;
}

export async function verifyAdminPassword(role: AdminRole, password: string) {
  if (!hasSigningSecret()) {
    return false;
  }

  const storedHash = await passwordHashForRole(role);

  if (storedHash) {
    return verifySecret(password, storedHash);
  }

  const configuredPassword = envPasswordForRole(role);

  return Boolean(configuredPassword && safeEqual(password, configuredPassword));
}

export async function createAdminSession(role: AdminRole) {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const value = `admin:${role}:${expiresAt}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, `${value}:${signValue(value)}`, {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const options = {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  for (const cookieName of [ADMIN_SESSION_COOKIE, LEGACY_ADMIN_SESSION_COOKIE]) {
    cookieStore.delete(cookieName);
    cookieStore.set(cookieName, "", { ...options, path: "/" });
    cookieStore.set(cookieName, "", { ...options, path: "/admin" });
  }
}

export async function getAdminSessionRole() {
  if (!isAdminPasswordConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const [scope, roleValue, expiresAtValue, signature] = session?.split(":") ?? [];
  const role = roleValue === "owner" || roleValue === "manager" ? roleValue : null;

  if (scope !== "admin" || !role || !expiresAtValue || !signature) {
    return null;
  }

  const expiresAt = Number(expiresAtValue);
  const signedValue = `${scope}:${role}:${expiresAtValue}`;
  const expectedSignature = signValue(signedValue);

  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    signature.length !== expectedSignature.length ||
    !safeEqual(signature, expectedSignature)
  ) {
    await clearAdminSession();
    return null;
  }

  return role;
}

export async function isAdminAuthenticated() {
  return Boolean(await getAdminSessionRole());
}

export async function requireAdmin() {
  return isAdminAuthenticated();
}

export async function requireOwnerAdmin() {
  return (await getAdminSessionRole()) === "owner";
}

export async function updateAdminPassword(role: AdminRole, newPassword: string) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "not-configured" as const };
  }

  const passwordHash = await hashSecret(newPassword);
  const { error } = await supabase.from("admin_passwords").upsert({
    role,
    password_hash: passwordHash,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to update admin password", error);
    return { ok: false, reason: "error" as const };
  }

  return { ok: true as const };
}

export async function createAdminResetToken(role: AdminRole) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "not-configured" as const };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ADMIN_RESET_MAX_AGE_SECONDS * 1000);
  const { error } = await supabase.from("admin_password_resets").insert({
    role,
    token_hash: hashResetToken(token),
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("Failed to create admin reset token", error);
    return { ok: false, reason: "error" as const };
  }

  return { ok: true as const, token };
}

export async function consumeAdminResetToken(
  role: AdminRole,
  token: string,
  newPassword: string,
) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: "not-configured" as const };
  }

  if (!token || token.length < 24) {
    return { ok: false, reason: "invalid" as const };
  }

  const tokenHash = hashResetToken(token);
  const { data, error } = await supabase
    .from("admin_password_resets")
    .select("id, role, token_hash, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .eq("role", role)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to load admin reset token", error);
    return { ok: false, reason: "invalid" as const };
  }

  const row = data as AdminResetRow;

  if (row.used_at || new Date(row.expires_at) <= new Date()) {
    return { ok: false, reason: "expired" as const };
  }

  const passwordUpdate = await updateAdminPassword(role, newPassword);

  if (!passwordUpdate.ok) {
    return passwordUpdate;
  }

  await supabase
    .from("admin_password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);

  return { ok: true as const, role };
}
