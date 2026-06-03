import Image from "next/image";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  LogOut,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAdmin } from "@/app/admin/login/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { getAutoApproveProfessionals } from "@/lib/admin-settings";
import {
  isActiveFeaturedProfessional,
  recentProfessionals,
} from "@/lib/marketplace-data";
import { PageNavigation } from "@/components/page-navigation";
import { fallbackProfessionalImage } from "@/lib/professional-photo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import {
  approveProfessional,
  deleteProfessional,
  makeProfessionalFeatured,
  rejectProfessional,
  removeProfessionalFeatured,
  updateAutoApprovalMode,
  verifyCnic,
} from "./actions";

type Requirement = {
  id: string;
  required_service: string;
  area: string | null;
  details: string;
  urgency: string;
  status: string;
  broadcast_status: string | null;
  created_at: string;
  cities: { name: string } | null;
  matched_count: number;
};

type PendingProfessional = {
  id: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string | null;
  area: string | null;
  gender: string | null;
  availability: string | null;
  years_experience: number | null;
  experience: string | null;
  expected_rate: string | null;
  short_bio: string | null;
  cnic: string | null;
  profile_photo_url: string | null;
  is_cnic_verified: boolean;
  is_active: boolean;
  created_at: string;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type AdminProfessional = {
  id: string;
  full_name: string;
  is_featured: boolean;
  featured_until: string | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

export const metadata = {
  title: "Admin Dashboard | Kamker",
  description: "Kamker admin dashboard for requirements and registrations.",
};

export const dynamic = "force-dynamic";

function isDbFeatured(professional: AdminProfessional) {
  return (
    professional.is_featured &&
    Boolean(professional.featured_until) &&
    new Date(professional.featured_until as string) > new Date()
  );
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

async function getRequirements() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as Requirement[];
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("id, required_service, area, details, urgency, status, broadcast_status, created_at, cities(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to load requirements", error);
    return [] as Requirement[];
  }

  const requirements = (data ?? []) as unknown as Omit<Requirement, "matched_count">[];
  const requirementIds = requirements.map((requirement) => requirement.id);

  if (requirementIds.length === 0) {
    return [] as Requirement[];
  }

  const { data: matches, error: matchesError } = await supabase
    .from("requirement_matches")
    .select("requirement_id")
    .in("requirement_id", requirementIds);

  if (matchesError) {
    console.error("Failed to load requirement match counts", matchesError);
  }

  const countByRequirement = new Map<string, number>();

  ((matches ?? []) as { requirement_id: string }[]).forEach((match) => {
    countByRequirement.set(
      match.requirement_id,
      (countByRequirement.get(match.requirement_id) ?? 0) + 1,
    );
  });

  return requirements.map((requirement) => ({
    ...requirement,
    matched_count: countByRequirement.get(requirement.id) ?? 0,
  }));
}

async function getPendingProfessionals() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as PendingProfessional[];
  }

  const { data, error } = await supabase
    .from("professionals")
    .select("id, full_name, phone_number, whatsapp_number, area, gender, availability, years_experience, experience, expected_rate, short_bio, cnic, profile_photo_url, is_cnic_verified, is_active, created_at, cities(name), categories(name)")
    .eq("is_active", false)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to load pending professionals", error);
    return [] as PendingProfessional[];
  }

  return (data ?? []) as unknown as PendingProfessional[];
}

async function getAdminProfessionals() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as AdminProfessional[];
  }

  const { data, error } = await supabase
    .from("professionals")
    .select("id, full_name, is_featured, featured_until, cities(name), categories(name)")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load featured professionals", error);
    return [] as AdminProfessional[];
  }

  return (data ?? []) as unknown as AdminProfessional[];
}

export default async function AdminPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const [
    requirements,
    pendingProfessionals,
    adminProfessionals,
    autoApproveProfessionals,
  ] =
    await Promise.all([
      getRequirements(),
      getPendingProfessionals(),
      getAdminProfessionals(),
      getAutoApproveProfessionals(),
    ]);

  const showDemoFeaturedManagement = adminProfessionals.length === 0;
  const activeFeaturedCount = showDemoFeaturedManagement
    ? recentProfessionals.filter((professional) =>
        isActiveFeaturedProfessional(professional),
      ).length
    : adminProfessionals.filter(isDbFeatured).length;

  const adminStats = [
    {
      label: "Pending Professionals",
      value: String(pendingProfessionals.length),
      icon: BadgeCheck,
    },
    { label: "Total Customers", value: "32,400+", icon: Users },
    { label: "Recent Requirements", value: String(requirements.length), icon: Send },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <PageNavigation />
          {adminAuthenticated ? (
            <form action={logoutAdmin}>
              <Button variant="outline" size="sm">
                <LogOut aria-hidden="true" />
                Logout
              </Button>
            </form>
          ) : null}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review requirements and approve professionals before they appear publicly.
        </p>

        {!adminPasswordConfigured ? (
          <Card className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm">
            <CardContent className="flex gap-3 p-4">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Admin password is not configured</p>
                <p className="mt-1 text-sm text-amber-900">
                  Set KAMKER_ADMIN_PASSWORD in the environment. Admin actions are
                  disabled until a protected admin session exists.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Auto-Approval Mode
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {autoApproveProfessionals ? "ON" : "OFF"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Control whether new professional registrations appear publicly
                  without manual review.
                </p>
                {autoApproveProfessionals ? (
                  <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-950">
                    New profiles will appear publicly without manual review.
                  </p>
                ) : null}
              </div>
              <form action={updateAutoApprovalMode} className="rounded-lg border p-3">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    name="autoApprove"
                    type="checkbox"
                    defaultChecked={autoApproveProfessionals}
                    className="size-5 accent-primary"
                    disabled={!adminAuthenticated}
                  />
                  Enable auto-approval
                </label>
                <Button
                  className="mt-3 h-10 w-full"
                  type="submit"
                  disabled={!adminAuthenticated}
                >
                  Save Mode
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {adminPasswordConfigured ? (
          <Card className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm">
            <CardContent className="flex gap-3 p-4">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Admin protection active</p>
                <p className="mt-1 text-sm text-amber-900">
                  Keep KAMKER_ADMIN_PASSWORD private and rotate it if shared.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {adminStats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <p className="mt-4 text-2xl font-bold">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">
                    Featured Professionals
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Promote profiles and set the featured_until date.
                  </p>
                </div>
              </div>
              <Badge className="w-fit bg-primary text-primary-foreground">
                {activeFeaturedCount} active
              </Badge>
            </div>

            <div className="mt-5 grid gap-3">
              {showDemoFeaturedManagement
                ? recentProfessionals.map((professional) => {
                    const isFeatured =
                      isActiveFeaturedProfessional(professional);

                    return (
                      <div
                        key={professional.id}
                        className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_220px_140px_150px]"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{professional.name}</p>
                            {isFeatured ? (
                              <Badge className="gap-1 bg-[#f6c343] text-[#241a04] hover:bg-[#f6c343]">
                                <Sparkles className="size-3" aria-hidden="true" />
                                Featured
                              </Badge>
                            ) : (
                              <Badge variant="outline">Regular</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {professional.role} - {professional.city}
                          </p>
                        </div>

                        <label className="grid gap-2">
                          <span className="flex items-center gap-1 text-sm font-medium">
                            <CalendarDays className="size-4" aria-hidden="true" />
                            featured_until
                          </span>
                          <input
                            name="featuredUntil"
                            type="date"
                            defaultValue={professional.featured_until ?? ""}
                            className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </label>

                        <div className="grid gap-2 sm:grid-cols-2 lg:w-72">
                          <Button className="h-11" disabled={!adminAuthenticated}>
                            Make Featured
                          </Button>
                          <Button
                            variant="outline"
                            className="h-11"
                            disabled={!adminAuthenticated}
                          >
                            Remove Featured
                          </Button>
                        </div>
                      </div>
                    );
                  })
                : adminProfessionals.map((professional) => {
                    const isFeatured = isDbFeatured(professional);

                    return (
                      <div
                        key={professional.id}
                        className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_220px_auto]"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {professional.full_name}
                            </p>
                            {isFeatured ? (
                              <Badge className="gap-1 bg-[#f6c343] text-[#241a04] hover:bg-[#f6c343]">
                                <Sparkles className="size-3" aria-hidden="true" />
                                Featured
                              </Badge>
                            ) : (
                              <Badge variant="outline">Regular</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {professional.categories?.name ?? "Professional"} -{" "}
                            {professional.cities?.name ?? "Unknown city"}
                          </p>
                        </div>

                        <form action={makeProfessionalFeatured} className="contents">
                          <input
                            type="hidden"
                            name="professionalId"
                            value={professional.id}
                          />
                          <label className="grid gap-2">
                            <span className="flex items-center gap-1 text-sm font-medium">
                              <CalendarDays className="size-4" aria-hidden="true" />
                              featured_until
                            </span>
                            <input
                              name="featuredUntil"
                              type="date"
                              defaultValue={dateInputValue(professional.featured_until)}
                              className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </label>
                          <Button
                            className="h-11"
                            type="submit"
                            disabled={!adminAuthenticated}
                          >
                            Make Featured
                          </Button>
                        </form>
                        <form action={removeProfessionalFeatured}>
                          <input
                            type="hidden"
                            name="professionalId"
                            value={professional.id}
                          />
                          <Button
                            variant="outline"
                            className="h-11 w-full"
                            type="submit"
                            disabled={!adminAuthenticated}
                          >
                            Remove Featured
                          </Button>
                        </form>
                      </div>
                    );
                  })}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Pending Professionals</h2>
            </div>

            {pendingProfessionals.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {pendingProfessionals.map((professional) => (
                  <div key={professional.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <Image
                          src={professional.profile_photo_url ?? fallbackProfessionalImage()}
                          alt={`${professional.full_name} profile photo`}
                          width={64}
                          height={64}
                          className="size-14 rounded-full bg-accent object-cover"
                        />
                        <div>
                          <p className="font-semibold">{professional.full_name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {professional.categories?.name ?? "Professional"} -{" "}
                            {professional.cities?.name ?? "Unknown city"}
                            {professional.area ? ` - ${professional.area}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        Pending Review
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                      <span>Full name: {professional.full_name}</span>
                      <span>Phone: {professional.phone_number}</span>
                      <span>WhatsApp: {professional.whatsapp_number ?? "Not provided"}</span>
                      <span>City: {professional.cities?.name ?? "Unknown city"}</span>
                      <span>Area: {professional.area ?? "Not provided"}</span>
                      <span>Category: {professional.categories?.name ?? "Professional"}</span>
                      <span>Gender: {professional.gender ?? "Not provided"}</span>
                      <span>Availability: {professional.availability ?? "Not provided"}</span>
                      <span>Years experience: {professional.years_experience ?? "Not provided"}</span>
                      <span>Hourly Rate: {professional.expected_rate ?? "Not provided"}</span>
                      <span>Experience: {professional.experience ?? "Not provided"}</span>
                      <span>CNIC: {professional.cnic ? "Provided" : "Not provided"}</span>
                      <span>
                        CNIC status: {professional.is_cnic_verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                    {professional.short_bio ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {professional.short_bio}
                      </p>
                    ) : null}
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <form action={approveProfessional}>
                        <input
                          type="hidden"
                          name="professionalId"
                          value={professional.id}
                        />
                        <Button
                          className="w-full"
                          type="submit"
                          disabled={!adminAuthenticated}
                        >
                          Approve Profile
                        </Button>
                      </form>
                      <form action={rejectProfessional}>
                        <input
                          type="hidden"
                          name="professionalId"
                          value={professional.id}
                        />
                        <Button
                          className="w-full"
                          type="submit"
                          variant="outline"
                          disabled={!adminAuthenticated}
                        >
                          Keep Pending
                        </Button>
                      </form>
                      <form action={verifyCnic}>
                        <input
                          type="hidden"
                          name="professionalId"
                          value={professional.id}
                        />
                        <Button
                          className="w-full"
                          type="submit"
                          variant="outline"
                          disabled={!adminAuthenticated}
                        >
                          {professional.is_cnic_verified
                            ? "CNIC Verified"
                            : "Verify CNIC"}
                        </Button>
                      </form>
                    </div>
                    <form
                      action={deleteProfessional}
                      className="mt-4 grid gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 sm:grid-cols-[1fr_auto]"
                    >
                      <input
                        type="hidden"
                        name="professionalId"
                        value={professional.id}
                      />
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium">
                          Reject/Delete Profile
                        </span>
                        <input
                          name="confirmDelete"
                          placeholder="Type DELETE to confirm"
                          disabled={!adminAuthenticated}
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                      </label>
                      <Button
                        className="h-10 self-end bg-red-600 text-white hover:bg-red-700"
                        type="submit"
                        disabled={!adminAuthenticated}
                      >
                        Delete Profile
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No pending professionals found.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Send className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Submitted Requirements</h2>
            </div>

            {requirements.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {requirements.map((requirement) => (
                  <div key={requirement.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={`/admin/requirements/${requirement.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {requirement.required_service}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {requirement.cities?.name ?? "Unknown city"}
                          {requirement.area ? ` - ${requirement.area}` : ""} -{" "}
                          {requirement.urgency}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {requirement.status} /{" "}
                        {requirement.broadcast_status ?? "free"}
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      Matched Professionals: {requirement.matched_count}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {requirement.details}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No requirements found yet. Submit one from the Send Requirement
                page after setup.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
