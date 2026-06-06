import Link from "next/link";
import { KeyRound, ShieldAlert } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isAdminPasswordConfigured } from "@/lib/admin-auth";

import { resetAdminPassword } from "../login/actions";

export const metadata = {
  title: "Reset Admin Password | Kamker",
};

export const dynamic = "force-dynamic";

const statusMessages = {
  invalid: "Reset link or password confirmation is invalid.",
  expired: "Reset link expired or was already used.",
  "not-configured": "Supabase and admin auth must be configured before passwords can be reset.",
  error: "Password could not be reset. Try again.",
} as const;

type ResetAdminPasswordPageProps = {
  searchParams?: Promise<{
    role?: string;
    token?: string;
    status?: keyof typeof statusMessages;
  }>;
};

export default async function ResetAdminPasswordPage({
  searchParams,
}: ResetAdminPasswordPageProps) {
  const params = await searchParams;
  const role = params?.role === "manager" ? "manager" : "owner";
  const token = typeof params?.token === "string" ? params.token : "";
  const statusMessage = params?.status ? statusMessages[params.status] : null;
  const passwordConfigured = isAdminPasswordConfigured();
  const hasValidLink = token.length >= 24;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md">
        <PageNavigation />

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <KeyRound className="size-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Admin recovery
                </p>
                <h1 className="text-2xl font-bold tracking-normal">
                  Reset Password
                </h1>
              </div>
            </div>

            {!passwordConfigured || !hasValidLink ? (
              <DismissibleNotice className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" contentClassName="flex gap-2" closeLabel="Close reset warning">
                <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">
                    {!passwordConfigured ? "Admin reset is not configured." : "This reset link is invalid."}
                  </p>
                  <Link
                    href="/admin/forgot-password"
                    className="mt-2 inline-flex text-primary underline-offset-4 hover:underline"
                  >
                    Request a new reset link
                  </Link>
                </div>
              </DismissibleNotice>
            ) : (
              <form action={resetAdminPassword} className="mt-5 grid gap-4">
                {statusMessage ? (
                  <DismissibleNotice className="rounded-lg border bg-secondary/60 p-4 text-sm font-medium" closeLabel="Close reset message">
                    {statusMessage}
                  </DismissibleNotice>
                ) : null}
                <input type="hidden" name="role" value={role} />
                <input type="hidden" name="token" value={token} />
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-muted-foreground">
                  Resetting the {role} admin password. This link can be used once.
                </p>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">New password</span>
                  <input
                    name="newPassword"
                    type="password"
                    minLength={6}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="At least 6 characters"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Confirm password</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    minLength={6}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Repeat new password"
                  />
                </label>
                <Button className="h-12">Reset Password</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
