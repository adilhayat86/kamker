import { cookies } from "next/headers";

const DRAFT_MAX_AGE_SECONDS = 60 * 20;
const COOKIE_PREFIX = "kamker_form_draft_";

function cookieName(key: string) {
  return `${COOKIE_PREFIX}${key}`;
}

function encodeDraft(values: Record<string, string | number>) {
  return Buffer.from(JSON.stringify(values), "utf8").toString("base64url");
}

function decodeDraft<T extends Record<string, string>>(value: string | undefined) {
  if (!value) {
    return {} as Partial<T>;
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

    return typeof parsed === "object" && parsed !== null
      ? (parsed as Partial<T>)
      : ({} as Partial<T>);
  } catch {
    return {} as Partial<T>;
  }
}

export async function saveFormDraft(
  key: string,
  values: Record<string, string | number>,
  options?: { path?: string },
) {
  const cookieStore = await cookies();

  cookieStore.set(cookieName(key), encodeDraft(values), {
    httpOnly: true,
    maxAge: DRAFT_MAX_AGE_SECONDS,
    path: options?.path ?? `/register/${key}`,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getFormDraft<T extends Record<string, string>>(
  key: string,
) {
  const cookieStore = await cookies();

  return decodeDraft<T>(cookieStore.get(cookieName(key))?.value);
}

export async function clearFormDraft(key: string, options?: { path?: string }) {
  const cookieStore = await cookies();

  cookieStore.set(cookieName(key), "", {
    httpOnly: true,
    maxAge: 0,
    path: options?.path ?? `/register/${key}`,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
