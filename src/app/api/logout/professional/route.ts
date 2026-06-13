import { NextResponse } from "next/server";

import { clearCustomerSession, clearProfessionalSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await Promise.all([clearProfessionalSession(), clearCustomerSession()]);

  return NextResponse.redirect(new URL("/login", request.url));
}
