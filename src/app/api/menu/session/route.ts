import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { menuSessionFromResponse } from "@/lib/menu-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const [professional, customer, adminAuthenticated] = await Promise.all([
    getSessionProfessional(),
    getSessionCustomer(),
    isAdminAuthenticated(),
  ]);

  return NextResponse.json(
    menuSessionFromResponse({
      professionalLoggedIn: Boolean(professional),
      customerLoggedIn: Boolean(customer),
      adminAuthenticated,
    }),
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
