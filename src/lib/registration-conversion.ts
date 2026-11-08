import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "kamker_registration_conversion";

// This marker is created only after signup and session creation succeed.
export async function markRegistrationConversion(professionalId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify({ professionalId, eventId: randomUUID() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/account",
    maxAge: 1800,
  });
}

export async function getRegistrationConversion(professionalId: string) {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  try {
    const marker = JSON.parse(value) as { professionalId?: string; eventId?: string };
    return marker.professionalId === professionalId && /^[a-f0-9-]{36}$/.test(marker.eventId ?? "")
      ? marker.eventId!
      : null;
  } catch {
    return null;
  }
}
