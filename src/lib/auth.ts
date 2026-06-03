import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";

import type { AccountProfessional } from "@/lib/account";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE = "kamker_professional_session";
const RECOVERY_COOKIE = "kamker_password_recovery";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const RECOVERY_MAX_AGE_SECONDS = 60 * 10;

type AuthProfessional = {
  id: string;
  phone_number: string;
  password_hash: string | null;
  secret_question: string | null;
  secret_answer_hash: string | null;
};

export function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function signingSecret() {
  return (
    process.env.KAMKER_AUTH_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "kamker-local-development-secret"
  );
}

function signRecoveryValue(professionalId: string, expiresAt: number) {
  return createHmac("sha256", signingSecret())
    .update(`${professionalId}:${expiresAt}`)
    .digest("base64url");
}

export async function hashSecret(value: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(value, salt, 64)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("base64url")}`;
}

export async function verifySecret(value: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, key] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !key) {
    return false;
  }

  const storedKey = Buffer.from(key, "base64url");
  const derivedKey = (await scrypt(value, salt, storedKey.length)) as Buffer;

  return (
    storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey)
  );
}

export async function findProfessionalByPhone(phoneNumber: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, phone_number, password_hash, secret_question, secret_answer_hash",
    )
    .limit(500);

  if (error) {
    console.error("Failed to find professional by phone", error);
    return null;
  }

  return (
    ((data ?? []) as AuthProfessional[]).find(
      (professional) =>
        normalizePhoneNumber(professional.phone_number) === normalizedPhone,
    ) ?? null
  );
}

export async function createProfessionalSession(professionalId: string) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const { error } = await supabase.from("professional_sessions").insert({
    professional_id: professionalId,
    session_token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("Failed to create professional session", error);
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearProfessionalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("professional_sessions")
      .delete()
      .eq("session_token_hash", hashToken(token));

    if (error) {
      console.error("Failed to clear professional session", error);
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionProfessional() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const { data: session, error: sessionError } = await supabase
    .from("professional_sessions")
    .select("professional_id, expires_at")
    .eq("session_token_hash", hashToken(token))
    .maybeSingle();

  if (sessionError || !session) {
    if (sessionError) {
      console.error("Failed to load professional session", sessionError);
    }

    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (new Date(session.expires_at as string) <= new Date()) {
    await clearProfessionalSession();
    return null;
  }

  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, gender, availability, years_experience, experience, expected_rate, short_bio, cnic, is_cnic_verified, is_phone_verified, is_active, is_featured, featured_until, cities(name), categories(name)",
    )
    .eq("id", session.professional_id as string)
    .maybeSingle();

  if (professionalError) {
    console.error("Failed to load session professional", professionalError);
    return null;
  }

  return professional as unknown as AccountProfessional | null;
}

export async function createPasswordRecoverySession(professionalId: string) {
  const expiresAt = Date.now() + RECOVERY_MAX_AGE_SECONDS * 1000;
  const signature = signRecoveryValue(professionalId, expiresAt);
  const cookieStore = await cookies();

  cookieStore.set(RECOVERY_COOKIE, `${professionalId}:${expiresAt}:${signature}`, {
    httpOnly: true,
    maxAge: RECOVERY_MAX_AGE_SECONDS,
    path: "/forgot-password",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getRecoveryProfessionalId() {
  const cookieStore = await cookies();
  const recoveryValue = cookieStore.get(RECOVERY_COOKIE)?.value;
  const [professionalId, expiresAtValue, signature] = recoveryValue?.split(":") ?? [];

  if (!professionalId || !expiresAtValue || !signature) {
    return null;
  }

  const expiresAt = Number(expiresAtValue);
  const expectedSignature = signRecoveryValue(professionalId, expiresAt);

  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    signature.length !== expectedSignature.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    await clearPasswordRecoverySession();
    return null;
  }

  return professionalId;
}

export async function clearPasswordRecoverySession() {
  const cookieStore = await cookies();

  cookieStore.delete(RECOVERY_COOKIE);
}
