import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

import { getAccountProfessional, isAccountFeatured } from "@/lib/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageNavigation } from "@/components/page-navigation";

export const metadata = {
  title: "Get Featured | Kamker",
  description: "Request featured placement for your Kamker professional profile.",
};

export default async function FeaturedProfilePage() {
  const professional = await getAccountProfessional();

  if (!professional) {
    redirect("/login");
  }

  const isFeatured = isAccountFeatured(professional);
  const supportNumber = process.env.NEXT_PUBLIC_KAMKER_SUPPORT_WHATSAPP?.replace(
    /\D/g,
    "",
  );
  const profession = professional.categories?.name ?? "Professional";
  const city = professional.cities?.name ?? "Pakistan";
  const whatsappText = encodeURIComponent(
    `Assalamualaikum Kamker, I want to get my profile featured. Name: ${professional.full_name}. Profession: ${profession}. City: ${city}.`,
  );

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref="/account" backLabel="My Account" />

        <Card className="mt-5 overflow-hidden bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-primary via-sky-500 to-blue-700 p-6 text-primary-foreground sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-lg">
                  <Crown className="size-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-white/80">
                    Featured profile
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-normal">
                    Get more visibility on Kamker
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
                    Featured profiles appear higher in browsing pages after
                    Kamker review and activation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-7">
              <div className="rounded-xl border bg-blue-50/70 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Your profile
                </p>
                <p className="mt-2 text-2xl font-bold tracking-normal">
                  {professional.full_name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profession} in {city}
                  {professional.area ? `, ${professional.area}` : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <Sparkles className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold">Higher placement</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Featured profiles are shown before regular profiles.
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold">Kamker review</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Activation is handled by Kamker admin after review.
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <Crown className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold">Current status</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {isFeatured ? "Featured is active." : "Featured is not active yet."}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {supportNumber ? (
                  <Button asChild className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                    <a
                      href={`https://wa.me/${supportNumber}?text=${whatsappText}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle aria-hidden="true" />
                      Request on WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button className="h-12" disabled>
                    Support WhatsApp not configured
                  </Button>
                )}
                <Button asChild className="h-12" variant="outline">
                  <Link href="/account">Back to Account</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
