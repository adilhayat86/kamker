import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));

  for (const cookieName of [ADMIN_SESSION_COOKIE, LEGACY_ADMIN_SESSION_COOKIE]) {
    response.cookies.delete(cookieName);
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
