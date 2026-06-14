import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
} from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getRequirementBroadcastReport,
  safeReportError,
} from "@/lib/requirement-report";

type BroadcastReportViewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Delivery Report | Kamker",
  description: "View and download a Kamker requirement broadcast delivery report.",
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) {
    return "Not sent";
  }

  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(new Date(value));
}

function statusClassName(status: string) {
  if (status === "sent") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function BroadcastReportViewPage({
  params,
}: BroadcastReportViewPageProps) {
  const { id } = await params;
  const report = await getRequirementBroadcastReport(id);
  const csvHref = `/send-requirement/${id}/broadcast-report`;

  if (!report.ok) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <PageNavigation
            backHref={`/send-requirement/${id}/payment`}
            backLabel="Payment"
          />
          <Card className="mt-5 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-1 size-5 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <h1 className="text-xl font-bold">Report unavailable</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {report.error}
                  </p>
                  <Button asChild className="mt-5">
                    <Link href={`/send-requirement/${id}/payment`}>
                      Back to Payment
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  const sentCount = report.logs.filter((log) => log.status === "sent").length;
  const failedCount = report.logs.filter((log) => log.status === "failed").length;
  const skippedCount = report.logs.filter((log) => log.status === "skipped").length;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <PageNavigation
          backHref={`/send-requirement/${id}/payment`}
          backLabel="Payment"
        />

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="secondary" className="gap-1.5">
              <FileText className="size-3.5" aria-hidden="true" />
              Delivery report
            </Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-normal">
              Requirement broadcast report
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              These are the WhatsApp delivery attempts for your paid Kamker
              requirement broadcast.
            </p>
          </div>
          <div className="grid gap-2 sm:min-w-52">
            <Button asChild className="h-11">
              <a href={csvHref} download={report.filename}>
                <Download className="size-4" aria-hidden="true" />
                Download CSV
              </a>
            </Button>
            <Button asChild variant="outline" className="h-11 bg-white">
              <Link href={`/send-requirement/${id}/payment`}>Back to Payment</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Sent
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {sentCount}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Failed
              </p>
              <p className="mt-2 text-3xl font-bold text-red-700">
                {failedCount}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Skipped
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-700">
                {skippedCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="border-b px-5 py-4">
              <h2 className="font-bold">Recipient delivery rows</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Service: {report.requirement.required_service}
              </p>
            </div>
            {report.logs.length > 0 ? (
              <div className="divide-y">
                {report.logs.map((log) => (
                  <div
                    key={`${log.recipient_phone}-${log.created_at}`}
                    className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_0.7fr_1.4fr_1fr]"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Recipient
                      </p>
                      <p className="mt-1 font-semibold">{log.recipient_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Status
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 ${statusClassName(log.status)}`}
                      >
                        {log.status === "sent" ? (
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        ) : null}
                        {log.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Provider message ID
                      </p>
                      <p className="mt-1 break-all font-mono text-xs">
                        {log.provider_message_id || "Not available"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Sent time
                      </p>
                      <p className="mt-1">{formatDate(log.sent_at ?? log.created_at)}</p>
                    </div>
                    {log.error_message ? (
                      <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-800 md:col-span-4">
                        {safeReportError(log.error_message)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-muted-foreground">
                No WhatsApp delivery rows have been logged yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">CSV text fallback</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  If your browser blocks downloads, select this text and copy it.
                </p>
              </div>
              <Copy className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <textarea
              readOnly
              className="mt-4 min-h-48 w-full rounded-lg border bg-slate-50 p-3 font-mono text-xs leading-5 outline-none"
              value={report.csv}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
