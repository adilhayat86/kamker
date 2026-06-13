import { NextResponse } from "next/server";

import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const [professional, customer, adminAuthenticated] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
    isAdminAuthenticated(),
  ]);

  return NextResponse.json(
    {
      professionalLoggedIn: Boolean(professional),
      customerLoggedIn: Boolean(customer),
      adminAuthenticated,
      adminConfigured: isAdminPasswordConfigured(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
