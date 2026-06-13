import { NextResponse } from "next/server";

import { clearProfessionalSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await clearProfessionalSession();

  return NextResponse.redirect(new URL("/login", request.url));
}
