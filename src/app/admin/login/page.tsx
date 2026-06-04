import { redirect } from "next/navigation";
import { LockKeyhole, ShieldAlert } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";

import { loginAdmin } from "./actions";

export const metadata = {
  title: "Admin Login | Kamker",
};

export const dynamic = "force-dynamic";

const statusMessages = {
  invalid: "Admin password is incorrect.",
} as const;

type AdminLoginPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

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
                <LockKeyhole className="size-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Protected admin
                </p>
                <h1 className="text-2xl font-bold tracking-normal">
                  Admin Login
                </h1>
              </div>
            </div>

            {!passwordConfigured ? (
              <DismissibleNotice className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" contentClassName="flex gap-2" closeLabel="Close admin setup warning">
                  <ShieldAlert className="size-5 shrink-0" aria-hidden="true" />
                  <p>
                    Set <span className="font-semibold">KAMKER_ADMIN_PASSWORD</span>{" "}
                    and <span className="font-semibold">KAMKER_AUTH_SECRET</span>{" "}
                    in the deployment environment to enable admin login.
                  </p>
              </DismissibleNotice>
            ) : (
              <form action={loginAdmin} className="mt-5 grid gap-4">
                {statusMessage ? (
                  <DismissibleNotice className="rounded-lg border bg-secondary/60 p-4 text-sm font-medium" closeLabel="Close login message">
                    {statusMessage}
                  </DismissibleNotice>
                ) : null}
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Admin Password</span>
                  <input
                    name="password"
                    type="password"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Enter admin password"
                  />
                </label>
                <Button className="h-12">Login</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
