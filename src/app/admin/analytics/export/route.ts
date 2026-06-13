import { NextResponse, type NextRequest } from "next/server";

import {
  analyticsReportToCsv,
  loadAdminAnalyticsReport,
  parseAnalyticsFilters,
} from "@/lib/admin-analytics";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  const filters = parseAnalyticsFilters(request.nextUrl.searchParams);
  const report = await loadAdminAnalyticsReport(filters);
  const csv = analyticsReportToCsv(report);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kamker-analytics-${filters.range}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
