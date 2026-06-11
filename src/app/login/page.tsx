import Link from "next/link";
import { LockKeyhole, Phone } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { loginProfessional } from "./actions";

export const metadata = {
  title: "Professional Login | Kamker",
  description: "Log in to your Kamker professional account.",
};

const statusMessages = {
  missing: "Please enter phone number and password.",
  invalid: "Phone number or password is incorrect. Use the same phone number you entered during registration.",
  "phone-review": "This phone number needs admin review before login. Contact Kamker support.",
  "not-configured": "Supabase is not configured yet.",
  reset: "Password updated. You can log in now.",
  registered: "Registration submitted. Log in after your profile is ready.",
  "profile-deleted": "Your professional profile has been deleted.",
} as const;

type LoginPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="ml-1 text-red-600">
        *
      </span>
      <span className="sr-only"> required</span>
    </>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md">
        <PageNavigation backHref="/register" backLabel="Register" />
        <div className="mt-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Professional account
            </p>
            <h1 className="text-3xl font-bold tracking-normal">Login</h1>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">
          Use your registered phone number and password to manage your Kamker profile.
        </p>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close login message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <form action={loginProfessional} className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Phone Number<RequiredMark /></span>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    name="phone"
                    type="tel"
                    maxLength={16}
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-11 w-full rounded-md border border-input bg-background px-3 pl-9 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Registered phone number"
                    aria-describedby="login-phone-help"
                  />
                </div>
                <span id="login-phone-help" className="text-xs leading-5 text-muted-foreground">
                  Enter the same number used during registration.
                </span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Password<RequiredMark /></span>
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Password"
                />
              </label>
              <label className="flex items-start gap-3 rounded-md border bg-background p-3">
                <input
                  name="rememberPassword"
                  type="checkbox"
                  className="mt-1 size-4 rounded border-input text-primary accent-primary"
                />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">Keep me logged in</span>
                  <span className="text-xs leading-5 text-muted-foreground">
                    Use only on your own phone or computer.
                  </span>
                </span>
              </label>
              <Button className="h-12">Login</Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-5 grid gap-2 text-sm">
          <Link href="/forgot-password" className="font-medium text-primary">
            Forgot password?
          </Link>
          <p className="text-muted-foreground">
            New professional?{" "}
            <Link href="/register/professional" className="font-medium text-primary">
              Register here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
