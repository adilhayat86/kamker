import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Crown,
  Edit,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import {
  getAccountProfessional,
  getDemoAccountProfessional,
  isAccountFeatured,
} from "@/lib/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logoutProfessional } from "@/app/logout/actions";
import { PageNavigation } from "@/components/page-navigation";
import { fallbackProfessionalImage } from "@/lib/professional-photo";

export const metadata = {
  title: "My Account | Kamker",
  description: "Professional dashboard for Kamker profiles.",
};

const statusMessages = {
  updated: "Profile updated successfully.",
  registered: "Welcome to Kamker. Your professional profile has been created.",
  "registered-photo-skipped":
    "Welcome to Kamker. Your profile was created, but the photo could not be saved. You can add it later from Edit Profile.",
} as const;

type AccountPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold">{value || "Not provided"}</p>
    </div>
  );
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const statusMessage = status ? statusMessages[status] : null;
  const dbProfessional = await getAccountProfessional();

  if (!dbProfessional) {
    redirect("/login");
  }

  const demoProfessional = dbProfessional ? null : getDemoAccountProfessional();

  const fullName = dbProfessional?.full_name ?? demoProfessional?.name ?? "";
  const profession =
    dbProfessional?.categories?.name ?? demoProfessional?.role ?? "Professional";
  const city = dbProfessional?.cities?.name ?? demoProfessional?.city ?? "Pakistan";
  const area = dbProfessional?.area ?? demoProfessional?.area ?? null;
  const phoneNumber = dbProfessional?.phone_number ?? demoProfessional?.phone_number;
  const whatsappNumber =
    dbProfessional?.whatsapp_number ?? demoProfessional?.whatsapp_number;
  const gender = dbProfessional?.gender;
  const age = dbProfessional?.age;
  const availability = dbProfessional?.availability;
  const yearsExperience = dbProfessional?.years_experience;
  const experience = dbProfessional?.experience ?? demoProfessional?.experience;
  const expectedRate = dbProfessional?.expected_rate ?? demoProfessional?.rate;
  const tagline = dbProfessional?.tagline ?? demoProfessional?.tagline;
  const bio = dbProfessional?.short_bio ?? demoProfessional?.bio;
  const profilePhotoUrl =
    dbProfessional?.profile_photo_url ?? demoProfessional?.image ?? fallbackProfessionalImage();
  const isCnicVerified =
    dbProfessional?.is_cnic_verified ?? demoProfessional?.is_cnic_verified ?? false;
  const isApproved = dbProfessional?.is_active ?? demoProfessional?.is_active ?? false;
  const isFeatured = dbProfessional
    ? isAccountFeatured(dbProfessional)
    : Boolean(demoProfessional?.is_featured);
  const publicProfileHref = `/professionals/${dbProfessional?.id ?? demoProfessional?.id}`;
  const isNewRegistration = status === "registered" || status === "registered-photo-skipped";

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <PageNavigation backHref="/professionals" backLabel="Directory" />
          <div className="flex items-center gap-2">
            {dbProfessional ? (
              <form action={logoutProfessional}>
                <Button size="sm" variant="outline">
                  <LogOut aria-hidden="true" />
                  Logout
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        <Card className="mt-5 overflow-hidden bg-white shadow-sm">
          <CardContent className="p-0">
            <div className="bg-primary p-5 text-primary-foreground sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Image
                    src={profilePhotoUrl}
                    alt={`${fullName} profile photo`}
                    width={96}
                    height={96}
                    className="size-20 shrink-0 rounded-full bg-white object-cover ring-2 ring-white/60"
                  />
                  <div>
                    <p className="text-sm text-white/75">Account Dashboard</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-normal">
                      {fullName}
                    </h1>
                    <p className="mt-1 text-white/85">
                      {profession} in {city}
                      {area ? `, ${area}` : ""}
                    </p>
                    <p className="mt-2 max-w-xl text-sm font-medium text-white/90">
                      {tagline || "Trusted local professional"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:w-48">
                  <Button asChild className="h-11 bg-white text-primary hover:bg-white/90">
                    <Link href="/account/edit">
                      <Edit aria-hidden="true" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link href={publicProfileHref}>
                      <BriefcaseBusiness aria-hidden="true" />
                      View Public Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {statusMessage ? (
                <div className="mb-5 flex items-start gap-3 rounded-lg border bg-accent p-4 text-sm font-medium text-accent-foreground">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </div>
              ) : null}

              {!dbProfessional ? (
                <div className="mb-5 rounded-lg border border-dashed bg-secondary/60 p-4 text-sm text-muted-foreground">
                  Demo account is shown until a Supabase professional profile is
                  available.
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <BadgeCheck className="size-5 text-primary" aria-hidden="true" />
                    Approval
                  </div>
                  <p className="mt-2 text-lg font-bold">
                    {isApproved ? "Approved" : "Unapproved"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isApproved ? "Your profile can appear in search." : "Your profile is saved and waiting for review."}
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                    Verification
                  </div>
                  <p className="mt-2 text-lg font-bold">
                    {isCnicVerified ? "CNIC Verified" : "CNIC Pending"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Phone and CNIC checks help customers trust your profile.
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Crown className="size-5 text-primary" aria-hidden="true" />
                    Featured
                  </div>
                  <p className="mt-2 text-lg font-bold">
                    {isFeatured ? "Active" : "Available"}
                  </p>
                  <Button asChild variant={isFeatured ? "outline" : "default"} className="mt-3 h-10 w-full">
                    <Link href="/account/featured">
                      {isFeatured ? "View Featured Status" : "Get Featured"}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <section className="rounded-xl border bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">Profile Details</p>
                      <h2 className="mt-1 text-xl font-bold tracking-normal">What customers see</h2>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/account/edit">
                        <Edit aria-hidden="true" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <DetailCard label="Profession" value={profession} />
                    <DetailCard label="Hourly Rate" value={expectedRate} />
                    <DetailCard label="Availability" value={availability} />
                    <DetailCard label="Experience" value={yearsExperience ? `${yearsExperience} years` : experience} />
                    <DetailCard label="Age" value={age ? `Age ${age}` : null} />
                    <DetailCard label="Gender" value={gender} />
                    <DetailCard label="Profile Tagline" value={tagline} />
                    <DetailCard label="Location" value={`${city}${area ? `, ${area}` : ""}`} />
                  </div>
                  <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      Bio
                    </p>
                    <p className="mt-2 leading-7 text-muted-foreground">
                      {bio || "No bio added yet."}
                    </p>
                  </div>
                </section>

                <section className="rounded-xl border bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-primary">Private Contact</p>
                  <h2 className="mt-1 text-xl font-bold tracking-normal">Account information</h2>
                  <div className="mt-4 grid gap-3">
                    <DetailCard label="Phone Number" value={phoneNumber} />
                    <DetailCard label="WhatsApp Number" value={whatsappNumber} />
                    <div className="rounded-lg border bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-5 text-primary" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold">Service Location</p>
                          <p className="text-sm text-muted-foreground">
                            {city}
                            {area ? `, ${area}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button asChild className="h-12">
                  <Link href="/account/edit">
                    <Edit aria-hidden="true" />
                    Edit Profile
                  </Link>
                </Button>
                <form action={logoutProfessional}>
                  <Button variant="outline" className="h-12 w-full">
                    <LogOut aria-hidden="true" />
                    Logout
                  </Button>
                </form>
              </div>

              {isNewRegistration ? (
                <div className="mt-5 rounded-xl border bg-blue-50/70 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Your profile is created. Next, check it once and improve missing details.
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
