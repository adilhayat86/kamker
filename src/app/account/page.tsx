import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Crown,
  Edit,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { ContactActionButton } from "@/components/contact-action-button";
import {
  getAccountProfessional,
  getDemoAccountProfessional,
  isAccountFeatured,
} from "@/lib/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logoutProfessional } from "@/app/logout/actions";
import { PageNavigation } from "@/components/page-navigation";
import { fallbackProfessionalImage } from "@/lib/professional-photo";
import { whatsappHref as buildWhatsappHref } from "@/lib/phone";

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
  const whatsappLink = buildWhatsappHref(whatsappNumber);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <PageNavigation backHref="/professionals" backLabel="Directory" />
          <div className={isNewRegistration ? "hidden" : "flex items-center gap-2"}>
            <Button asChild size="sm" variant="outline">
              <Link href="/account/edit">
                <Edit aria-hidden="true" />
                Edit Profile
              </Link>
            </Button>
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
            <div
              className={
                isNewRegistration
                  ? "bg-gradient-to-br from-primary via-sky-500 to-blue-700 p-5 text-primary-foreground sm:p-7"
                  : "bg-primary p-5 text-primary-foreground sm:p-7"
              }
            >
              {isNewRegistration ? (
                <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="relative mt-1 flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-lg">
                      <span className="absolute inline-flex size-14 animate-ping rounded-full bg-white/30" />
                      <CheckCircle2 className="relative size-7" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-normal text-white/80">
                        Registration complete
                      </p>
                      <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">
                        Welcome to Kamker, {fullName.split(" ")[0] || fullName}
                      </h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
                        You are logged in. Your professional profile is ready to
                        review before customers see and contact you.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:w-52">
                    <Button asChild className="h-12 bg-white text-primary hover:bg-white/90">
                      <Link href={publicProfileHref}>View Profile</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-12 border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    >
                      <Link href="/account/edit">Improve Profile</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Image
                      src={profilePhotoUrl}
                      alt={`${fullName} profile photo`}
                      width={80}
                      height={80}
                      className="size-16 shrink-0 rounded-full bg-white object-cover ring-2 ring-white/60"
                    />
                    <div>
                      <p className="text-sm text-white/75">Professional Dashboard</p>
                      <h1 className="mt-1 text-3xl font-bold tracking-normal">
                        {fullName}
                      </h1>
                      <p className="mt-1 text-white/85">{profession}</p>
                    </div>
                  </div>
                  <Button asChild className="h-12 bg-white text-primary hover:bg-white/90">
                    <Link href="/account/edit">
                      <Edit aria-hidden="true" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-7">
              {isNewRegistration ? (
                <div className="-mt-10 mb-5 grid gap-3 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr] sm:items-center">
                  <Image
                    src={profilePhotoUrl}
                    alt={`${fullName} profile photo`}
                    width={80}
                    height={80}
                    className="size-20 rounded-full bg-secondary object-cover ring-4 ring-white"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                      Profile preview
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-normal">
                      {fullName}
                    </h2>
                    <p className="mt-1 font-medium text-muted-foreground">
                      {profession} in {city}
                      {area ? `, ${area}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {age ? `Age ${age}` : "Age not added"}
                    </p>
                    <p className="mt-2 line-clamp-1 text-sm font-semibold text-foreground">
                      {tagline || "Trusted local professional"}
                    </p>
                  </div>
                </div>
              ) : null}

              {statusMessage && !isNewRegistration ? (
                  <div className="mb-5 rounded-lg border bg-accent p-4 text-sm font-medium text-accent-foreground">
                    {statusMessage}
                  </div>
              ) : null}

              {!dbProfessional ? (
                <div className="mb-5 rounded-lg border border-dashed bg-secondary/60 p-4 text-sm text-muted-foreground">
                  Demo account is shown until a Supabase professional profile is
                  available.
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Badge className="justify-center gap-1 py-2">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  <span className="truncate text-xs sm:text-sm">
                    {isCnicVerified ? "CNIC Verified" : "CNIC Pending"}
                  </span>
                </Badge>
                <Badge
                  variant={isApproved ? "default" : "outline"}
                  className="justify-center gap-1 py-2"
                >
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  <span className="truncate text-xs sm:text-sm">
                    {isApproved ? "Approved" : "Pending Approval"}
                  </span>
                </Badge>
                {isFeatured ? (
                  <Badge className="justify-center gap-1 py-2">
                    <Crown className="size-4" aria-hidden="true" />
                    <span className="truncate text-xs sm:text-sm">
                      Featured Active
                    </span>
                  </Badge>
                ) : (
                  <Link
                    href="/account/featured"
                    className="inline-flex items-center justify-center gap-1 rounded-md border px-2.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:text-sm"
                  >
                    <Crown className="size-4" aria-hidden="true" />
                    <span className="truncate">Get Featured</span>
                  </Link>
                )}
              </div>

              <details
                className="mt-5 rounded-xl border bg-white shadow-sm"
                open={!isNewRegistration}
              >
                <summary className="cursor-pointer list-none p-4 text-sm font-semibold text-primary">
                  View account details
                </summary>
                <div className="border-t p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailCard label="Full Name" value={fullName} />
                    <DetailCard label="Profession" value={profession} />
                    <DetailCard label="City" value={city} />
                    <DetailCard label="Area" value={area} />
                    <DetailCard label="Phone Number" value={phoneNumber} />
                    <DetailCard label="WhatsApp Number" value={whatsappNumber} />
                    <DetailCard label="Gender" value={gender} />
                    <DetailCard label="Age" value={age ? `Age ${age}` : null} />
                    <DetailCard label="Availability" value={availability} />
                    <DetailCard label="Years Experience" value={yearsExperience} />
                    <DetailCard label="Experience" value={experience} />
                    <DetailCard label="Hourly Rate" value={expectedRate} />
                    <DetailCard label="Profile Tagline" value={tagline} />
                    <DetailCard
                      label="Featured Status"
                      value={isFeatured ? "Active" : "Inactive"}
                    />
                  </div>

                  <div className="mt-5 rounded-lg border bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                      Bio
                    </p>
                    <p className="mt-2 leading-7 text-muted-foreground">
                      {bio || "No bio added yet."}
                    </p>
                  </div>
                </div>
              </details>

              {isNewRegistration ? (
                <div className="mt-5 rounded-xl border bg-blue-50/70 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Next best steps
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      "Check your public profile",
                      "Add missing WhatsApp or CNIC details",
                      "Keep your rate and availability updated",
                    ].map((step, index) => (
                      <div key={step} className="flex gap-3 rounded-lg bg-white p-3 shadow-sm">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-5 text-muted-foreground">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <ContactActionButton
                  href={phoneNumber ? `tel:${phoneNumber}` : null}
                  displayValue={phoneNumber}
                  type="call"
                  className="h-12"
                  variant="outline"
                />
                <ContactActionButton
                  href={whatsappLink}
                  displayValue={whatsappNumber}
                  type="whatsapp"
                  className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]"
                  disabledLabel="WhatsApp missing"
                />
                <Button asChild className="h-12">
                  <Link href={publicProfileHref}>
                    <BriefcaseBusiness aria-hidden="true" />
                    View Profile
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
            <MapPin className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Service Location</p>
              <p className="text-sm text-muted-foreground">
                {city}
                {area ? `, ${area}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm">
            <Clock className="size-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Approval Status</p>
              <p className="text-sm text-muted-foreground">
                {isApproved
                  ? "Your profile can appear publicly."
                  : "Admin approval is required before public listing."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
