"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Registration page error", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-xl">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-5">
            <h1 className="text-2xl font-bold tracking-normal">
              Registration needs a refresh
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your browser had trouble loading this form. Refresh and try again.
              If photo upload caused the issue, register without a photo first
              and add it later from your account.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button onClick={reset}>Try Again</Button>
              <Button asChild variant="outline">
                <Link href="/register">Back to Register</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
