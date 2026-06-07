import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Crown, MapPin, MessageCircle, Phone, Send, Star } from "lucide-react";

import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { recentProfessionals } from "@/lib/marketplace-data";
import {
  getLocalProfessionalRecordById,
  localRecordToProfessional,
} from "@/lib/local-demo-store";
import { getSessionProfessional } from "@/lib/auth";

type ProfessionalProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DbProfessional = {
  id: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string | null;
  area: string | null;
  gender: string | null;
  age: number | null;
  availability: string | null;
  years_experience: number | null;
  experience: string | null;
  expected_rate: string | null;
  tagline: string | null;
  short_bio: string | null;
  profile_photo_url: string | null;
  is_cnic_verified: boolean;
  is_phone_verified: boolean;
  rating: number | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return recentProfessionals.map((professional) => ({
    id: professional.id,
  }));
}

async function getDbProfessional(id: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, gender, age, availability, years_experience, experience, expected_rate, tagline, short_bio, profile_photo_url, is_cnic_verified, is_phone_verified, rating, cities(name), categories(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load professional profile", error);
    return null;
  }

  return data as DbProfessional | null;
}

export async function generateMetadata({ params }: ProfessionalProfilePageProps) {
  const { id } = await params;
  const dbProfessional = await getDbProfessional(id);
  const localProfessional = dbProfessional
    ? null
    : await getLocalProfessionalRecordById(id);
  const demoProfessional = localProfessional
    ? localRecordToProfessional(localProfessional)
    : recentProfessionals.find((item) => item.id === id);
  const name = dbProfessional?.full_name ?? demoProfessional?.name;
  const role = dbProfessional?.categories?.name ?? demoProfessional?.role ?? "Professional";
  const city = dbProfessional?.cities?.name ?? demoProfessional?.city ?? "Pakistan";
  const tagline =
    dbProfessional?.tagline?.trim() ||
    demoProfessional?.tagline?.trim() ||
    "Trusted local professional";

  return {
    title: name
      ? `${name} - ${tagline} | Kamker`
      : "Professional Profile | Kamker",
    description: `${tagline}. ${role} in ${city} on Kamker. Contact directly by call or WhatsApp where available.`,
  };
}

export default async function ProfessionalProfilePage({
  params,
}: ProfessionalProfilePageProps) {
  const { id } = await params;
  const dbProfessional = await getDbProfessional(id);
  const localProfessional = dbProfessional
    ? null
    : await getLocalProfessionalRecordById(id);
  const sessionProfessional = await getSessionProfessional();
  const isOwnProfile = sessionProfessional?.id === id;
  const demoProfessional = localProfessional
    ? localRecordToProfessional(localProfessional)
    : recentProfessionals.find((item) => item.id === id);

  if (!dbProfessional && !demoProfessional) {
    notFound();
  }

  if (dbProfessional) {
    const whatsappNumber = dbProfessional.whatsapp_number ?? dbProfessional.phone_number;

    return (
      <main className="min-h-screen bg-background px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
        <section className="mx-auto max-w-3xl">
          <PageNavigation backHref="/professionals" backLabel="Professionals" />
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row">
                <Image
                  src={dbProfessional.profile_photo_url || "/kamker-professionals.png"}
                  alt={`${dbProfessional.full_name} profile photo`}
                  width={128}
                  height={128}
                  priority
                  className="size-28 rounded-full bg-accent object-cover"
                />
                <div className="flex-1">
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <BadgeCheck className="size-3" aria-hidden="true" />
                    {dbProfessional.is_phone_verified ? "Phone Verified" : "New Professional"}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {dbProfessional.is_cnic_verified ? "CNIC Verified" : "CNIC Pending"}
                  </Badge>
                  <h1 className="mt-3 text-3xl font-bold tracking-normal">
                    {dbProfessional.full_name}
                  </h1>
                  <p className="mt-1 text-lg font-semibold text-primary">
                    {dbProfessional.categories?.name ?? "Professional"}
                  </p>
                  <p className="mt-1 max-w-md truncate text-base font-medium">
                    {dbProfessional.tagline ?? "Trusted local professional"}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" aria-hidden="true" />
                    {dbProfessional.cities?.name ?? "Pakistan"}{dbProfessional.area ? `, ${dbProfessional.area}` : ""}
                  </p>
                  {isOwnProfile ? (
                    <Button asChild className="mt-4 h-11">
                      <Link href="/account/featured">
                        <Crown className="size-4" aria-hidden="true" />
                        Get Featured
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Years Experience</p>
                  <p className="mt-1 font-semibold">
                    {dbProfessional.years_experience ?? "Will be updated soon"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="mt-1 font-semibold">
                    {dbProfessional.expected_rate ?? "Contact for rate"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="mt-1 font-semibold">
                    {dbProfessional.availability ?? "Ask professional"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="mt-1 font-semibold">
                    {dbProfessional.gender ?? "Not provided"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="mt-1 font-semibold">
                    {dbProfessional.age ? `Age ${dbProfessional.age}` : "Age not added"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="mt-1 flex items-center gap-1 font-semibold">
                    <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                    {dbProfessional.rating ?? 0} (new)
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Response time</p>
                  <p className="mt-1 font-semibold">Contact directly</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="mt-2 leading-7">
                  {dbProfessional.short_bio ??
                    dbProfessional.experience ??
                    "This professional is new on Kamker."}
                </p>
              </div>

              <div className="mt-6 hidden gap-2 sm:grid sm:grid-cols-3">
                <Button asChild variant="outline" className="h-12">
                  <a href={`tel:${dbProfessional.phone_number}`}>
                    <Phone aria-hidden="true" />
                    Call
                  </a>
                </Button>
                <Button asChild className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                  <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}>
                    <MessageCircle aria-hidden="true" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild className="h-12">
                  <Link href="/send-requirement">
                    <Send aria-hidden="true" />
                    Send Requirement
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
        <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
          <Button asChild variant="outline" className="h-12">
            <a href={`tel:${dbProfessional.phone_number}`}>
              <Phone aria-hidden="true" />
              Call
            </a>
          </Button>
          <Button asChild className="h-12 bg-[#25d366] px-2 text-white hover:bg-[#21bd5b]">
            <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}>
              <MessageCircle aria-hidden="true" />
              WhatsApp
            </a>
          </Button>
          <Button asChild className="h-12 px-2">
            <Link href="/send-requirement">
              <Send aria-hidden="true" />
              Send
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const professional = demoProfessional!;
  const isOwnDemoProfile = sessionProfessional?.id === professional.id;

  return (
    <main className="min-h-screen bg-background px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation backHref="/professionals" backLabel="Professionals" />
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Image
                src={professional.image}
                alt={`${professional.name} profile photo`}
                width={128}
                height={128}
                priority
                className="size-28 rounded-full bg-accent object-cover"
              />
              <div className="flex-1">
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  Verified badge placeholder
                </Badge>
                <Badge variant="outline" className="ml-2">
                  CNIC Verification Badge
                </Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-normal">
                  {professional.name}
                </h1>
                <p className="mt-1 text-lg font-semibold text-primary">
                  {professional.role}
                </p>
                <p className="mt-1 max-w-md truncate text-base font-medium">
                  {professional.tagline}
                </p>
                <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" aria-hidden="true" />
                  {professional.city}, {professional.area}
                </p>
                {isOwnDemoProfile ? (
                  <Button asChild className="mt-4 h-11">
                    <Link href="/account/featured">
                      <Crown className="size-4" aria-hidden="true" />
                      Get Featured
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="mt-1 font-semibold">{professional.experience}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Hourly Rate</p>
                <p className="mt-1 font-semibold">{professional.rate}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="mt-1 font-semibold">
                  {professional.age ? `Age ${professional.age}` : "Age not added"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="mt-1 flex items-center gap-1 font-semibold">
                  <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                  {professional.rating} ({professional.ratingCount})
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Response time</p>
                <p className="mt-1 font-semibold">{professional.responseTime}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground">Bio</p>
              <p className="mt-2 leading-7">{professional.bio}</p>
            </div>

            <div className="mt-6 hidden gap-2 sm:grid sm:grid-cols-3">
              <Button variant="outline" className="h-12">
                <Phone aria-hidden="true" />
                Call
              </Button>
              <Button className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </Button>
              <Button asChild className="h-12">
                <Link href="/send-requirement">
                  <Send aria-hidden="true" />
                  Send Requirement
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t bg-white/95 p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden">
        <Button variant="outline" className="h-12">
          <Phone aria-hidden="true" />
          Call
        </Button>
        <Button className="h-12 bg-[#25d366] px-2 text-white hover:bg-[#21bd5b]">
          <MessageCircle aria-hidden="true" />
          WhatsApp
        </Button>
        <Button asChild className="h-12 px-2">
          <Link href="/send-requirement">
            <Send aria-hidden="true" />
            Send
          </Link>
        </Button>
      </div>
    </main>
  );
}
