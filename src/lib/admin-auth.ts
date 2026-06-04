import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "kamker_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function adminPassword() {
  return process.env.KAMKER_ADMIN_PASSWORD;
}

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

function signAdminSession(value: string) {
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

export function isAdminPasswordConfigured() {
  return Boolean(adminPassword() && hasSigningSecret());
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = adminPassword();

  return Boolean(
    configuredPassword && hasSigningSecret() && safeEqual(password, configuredPassword),
  );
}

export async function createAdminSession() {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const value = `admin:${expiresAt}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, `${value}:${signAdminSession(value)}`, {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  if (!isAdminPasswordConfigured()) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const [scope, expiresAtValue, signature] = session?.split(":") ?? [];

  if (scope !== "admin" || !expiresAtValue || !signature) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);
  const signedValue = `${scope}:${expiresAtValue}`;
  const expectedSignature = signAdminSession(signedValue);

  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    signature.length !== expectedSignature.length ||
    !safeEqual(signature, expectedSignature)
  ) {
    await clearAdminSession();
    return false;
  }

  return true;
}

export async function requireAdmin() {
  return isAdminAuthenticated();
}
