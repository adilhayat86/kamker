import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "kamker_admin_session_v2";
const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

function isAdminAuthConfigured() {
  return Boolean(
    process.env.KAMKER_AUTH_SECRET &&
      (process.env.KAMKER_OWNER_ADMIN_PASSWORD ||
        process.env.KAMKER_ADMIN_PASSWORD ||
        process.env.KAMKER_MANAGER_ADMIN_PASSWORD),
  );
}

function base64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function signValue(value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(process.env.KAMKER_AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

  return base64Url(signature);
}

async function hasValidAdminSession(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const [scope, role, expiresAtValue, signature] = session?.split(":") ?? [];

  if (
    scope !== "admin" ||
    (role !== "owner" && role !== "manager") ||
    !expiresAtValue ||
    !signature
  ) {
    return false;
  }

  const expiresAt = Number(expiresAtValue);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const signedValue = `${scope}:${role}:${expiresAtValue}`;
  const expectedSignature = await signValue(signedValue);

  return signature === expectedSignature;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin") || PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (!isAdminAuthConfigured()) {
    return NextResponse.next();
  }

  if (await hasValidAdminSession(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
