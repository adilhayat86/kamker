import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Clock,
  Crown,
  Edit,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import {
  getAccountProfessional,
  getDemoAccountProfessional,
  isAccountFeatured,
} from "@/lib/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logoutProfessional } from "@/app/logout/actions";

export const metadata = {
  title: "My Account | Kamker",
  description: "Professional dashboard for Kamker profiles.",
};

const statusMessages = {
  updated: "Profile updated successfully.",
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
  value: string | null | undefined;
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
  const experience = dbProfessional?.experience ?? demoProfessional?.experience;
  const expectedRate = dbProfessional?.expected_rate ?? demoProfessional?.rate;
  const bio = dbProfessional?.short_bio ?? demoProfessional?.bio;
  const isCnicVerified =
    dbProfessional?.is_cnic_verified ?? demoProfessional?.is_cnic_verified ?? false;
  const isApproved = dbProfessional?.is_active ?? demoProfessional?.is_active ?? false;
  const isFeatured = dbProfessional
    ? isAccountFeatured(dbProfessional)
    : Boolean(demoProfessional?.is_featured);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-medium text-primary">
            Kamker
          </Link>
          <div className="flex items-center gap-2">
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
            <div className="bg-primary p-5 text-primary-foreground sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                    <User className="size-8" aria-hidden="true" />
                  </div>
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
            </div>

            <div className="p-5 sm:p-7">
              {statusMessage ? (
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

              <div className="grid gap-3 sm:grid-cols-3">
                <Badge className="justify-center gap-1 py-2">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {isCnicVerified ? "CNIC Verified" : "CNIC Pending"}
                </Badge>
                <Badge
                  variant={isApproved ? "default" : "outline"}
                  className="justify-center gap-1 py-2"
                >
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  {isApproved ? "Approved" : "Pending Approval"}
                </Badge>
                <Badge
                  variant={isFeatured ? "default" : "outline"}
                  className="justify-center gap-1 py-2"
                >
                  <Crown className="size-4" aria-hidden="true" />
                  {isFeatured ? "Featured Active" : "Not Featured"}
                </Badge>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailCard label="Full Name" value={fullName} />
                <DetailCard label="Profession" value={profession} />
                <DetailCard label="City" value={city} />
                <DetailCard label="Area" value={area} />
                <DetailCard label="Phone Number" value={phoneNumber} />
                <DetailCard label="WhatsApp Number" value={whatsappNumber} />
                <DetailCard label="Experience" value={experience} />
                <DetailCard label="Expected Rate" value={expectedRate} />
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

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <Button asChild variant="outline" className="h-12">
                  <a href={`tel:${phoneNumber}`}>
                    <Phone aria-hidden="true" />
                    Call
                  </a>
                </Button>
                <Button asChild className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                  <a href={`https://wa.me/${whatsappNumber?.replace(/\D/g, "")}`}>
                    <MessageCircle aria-hidden="true" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild className="h-12">
                  <Link href="/professionals">
                    <BriefcaseBusiness aria-hidden="true" />
                    View Directory
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
