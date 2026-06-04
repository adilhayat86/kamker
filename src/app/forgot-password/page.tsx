import Link from "next/link";
import { HelpCircle, KeyRound, Phone } from "lucide-react";

import { DismissibleNotice } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { findProfessionalByPhone, normalizePhoneNumber } from "@/lib/auth";

import {
  resetPasswordWithSecretAnswer,
  startForgotPassword,
  verifySecretAnswer,
} from "./actions";

export const metadata = {
  title: "Forgot Password | Kamker",
  description: "Reset your Kamker professional password using your secret question.",
};

const statusMessages = {
  "missing-phone": "Enter your registered phone number.",
  "missing-answer": "Enter your secret answer.",
  "not-configured": "Supabase is not configured yet.",
  "not-found": "No professional account with recovery details was found.",
  "wrong-answer": "Secret answer is incorrect.",
  "recovery-expired": "Recovery session expired. Start again.",
  error: "Could not reset password. Please try again.",
} as const;

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    phone?: string;
    verified?: string;
    status?: keyof typeof statusMessages;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const phone = params?.phone ? normalizePhoneNumber(params.phone) : "";
  const verified = params?.verified === "1";
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const professional = phone ? await findProfessionalByPhone(phone) : null;
  const secretQuestion = professional?.secret_question ?? null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md">
        <PageNavigation backHref="/login" backLabel="Login" />
        <div className="mt-6 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KeyRound className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Professional account
            </p>
            <h1 className="text-3xl font-bold tracking-normal">
              Forgot Password
            </h1>
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">
          Reset your password with your registered phone number and secret
          question.
        </p>

        {statusMessage ? (
          <DismissibleNotice className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close password reset message">
            {statusMessage}
          </DismissibleNotice>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            {!phone ? (
              <form action={startForgotPassword} className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium">
                    Registered Phone Number
                  </span>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      name="phone"
                      type="tel"
                      className="h-11 w-full rounded-md border border-input bg-background px-3 pl-9 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="+92 300 0000000"
                    />
                  </div>
                </label>
                <Button className="h-12">Continue</Button>
              </form>
            ) : null}

            {phone && !verified ? (
              <form action={verifySecretAnswer} className="grid gap-4">
                <input type="hidden" name="phone" value={phone} />
                <div className="rounded-lg border bg-secondary/70 p-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="size-5 text-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold">Secret Question</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {secretQuestion ?? "No secret question found for this phone."}
                  </p>
                </div>
                <label className="grid gap-2">
                  <span className="text-sm font-medium">Secret Answer</span>
                  <input
                    name="secretAnswer"
                    type="password"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Answer"
                  />
                </label>
                <Button className="h-12" disabled={!secretQuestion}>
                  Verify Answer
                </Button>
              </form>
            ) : null}

            {phone && verified ? (
              <form action={resetPasswordWithSecretAnswer} className="grid gap-4">
                <input type="hidden" name="phone" value={phone} />
                <label className="grid gap-2">
                  <span className="text-sm font-medium">New Password</span>
                  <input
                    name="newPassword"
                    type="password"
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="New password"
                  />
                </label>
                <Button className="h-12">Set New Password</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>

        <Link href="/login" className="mt-5 block text-sm font-medium text-primary">
          Back to login
        </Link>
      </section>
    </main>
  );
}
