import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionProfessional } from "@/lib/auth";

import { logoutProfessional } from "./actions";

export const metadata = {
  title: "Logout | Kamker",
};

export default async function LogoutPage() {
  const professional = await getSessionProfessional();

  if (!professional) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-md">
        <PageNavigation backHref="/account" backLabel="Account" />
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <LogOut className="size-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-normal">Logout</h1>
                <p className="text-sm text-muted-foreground">
                  End your professional account session.
                </p>
              </div>
            </div>
            <form action={logoutProfessional} className="mt-5">
              <Button className="h-12 w-full">Logout</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
