import { NextResponse } from "next/server";

import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { getSessionProfessional } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const [professional, adminAuthenticated] = await Promise.all([
    getSessionProfessional(),
    isAdminAuthenticated(),
  ]);

  return NextResponse.json({
    professionalLoggedIn: Boolean(professional),
    adminAuthenticated,
    adminConfigured: isAdminPasswordConfigured(),
  });
}
