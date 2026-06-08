import { NextResponse } from "next/server";

import { recordAdminAudit } from "@/lib/admin-audit";
import { clearAdminSession, getAdminSessionRole } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const role = await getAdminSessionRole();

  await recordAdminAudit({
    action: "admin_logout",
    targetType: "admin_session",
    metadata: { role: role ?? "unknown" },
  });
  await clearAdminSession();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}
