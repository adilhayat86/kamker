import Link from "next/link";
import { MailCheck, ShieldAlert } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminOwnerEmail, isAdminPasswordConfigured } from "@/lib/admin-auth";

import { requestAdminPasswordReset } from "../login/actions";

export const metadata = {
  title: "Forgot Admin Password | Kamker",
};

export const dynamic = "force-dynamic";

const statusMessages = {
  sent: `Reset link sent to ${adminOwnerEmail()}.`,
  "email-not-configured": "Email is not configured. Set RESEND_API_KEY and KAMKER_EMAIL_FROM to send reset links.",
  "email-error": "Email provider rejected the reset email. Check provider setup and sender verification.",
  "not-configured": "Supabase and admin auth must be configured before reset links can be created.",
  error: "Reset link could not be created. Try again.",
} as const;

type ForgotAdminPasswordPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

export default async function ForgotAdminPasswordPage({
  searchParams,
}: ForgotAdminPasswordPageProps) {
  const params = await searchParams;
  const statusMessage = params?.status ? statusMessages[params.status] : null;
  const passwordConfigured = isAdminPasswordConfigured();

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md">
        <PageNavigation />

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <MailCheck className="size-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Admin recovery
                </p>
                <h1 className="text-2xl font-bold tracking-normal">
                  Forgot Password
                </h1>
              </div>
            </div>

            {!passwordConfigured ? (
              <DismissibleNotice className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" contentClassName="flex gap-2" closeLabel="Close admin setup warning">
                <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
                <p>
                  Configure admin auth and Supabase before using password reset.
                </p>
              </DismissibleNotice>
            ) : (
              <form action={requestAdminPasswordReset} className="mt-5 grid gap-4">
                {statusMessage ? (
                  <DismissibleNotice className="rounded-lg border bg-secondary/60 p-4 text-sm font-medium" closeLabel="Close reset message">
                    {statusMessage}
                  </DismissibleNotice>
                ) : null}
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Admin role</span>
                  <select
                    name="role"
                    defaultValue="owner"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                  </select>
                </label>
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-muted-foreground">
                  A confirmation link will be sent to {adminOwnerEmail()}.
                </p>
                <Button className="h-12">Send Reset Link</Button>
                <Link
                  href="/admin/login"
                  className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Back to admin login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
