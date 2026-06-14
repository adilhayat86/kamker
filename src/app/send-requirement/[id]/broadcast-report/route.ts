import { NextResponse } from "next/server";

import { getRequirementBroadcastReport } from "@/lib/requirement-report";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const report = await getRequirementBroadcastReport(id);

  if (!report.ok) {
    return NextResponse.json({ error: report.error }, { status: report.status });
  }

  return new Response(report.csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${report.filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
