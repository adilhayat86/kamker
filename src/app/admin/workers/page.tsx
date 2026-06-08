import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  approveProfessional,
  deleteProfessional,
  makeProfessionalFeatured,
  removeDisputedProfessionalNumber,
  rejectProfessional,
  removeProfessionalFeatured,
  verifyCnic,
} from "@/app/admin/actions";
import {
  AdminEmptyState,
  AdminMetaGrid,
  AdminSection,
  AdminShell,
  AdminStatusBadge,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { pakistanMobileNormalizedDigits } from "@/lib/phone";
import { fallbackProfessionalImage } from "@/lib/professional-photo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Workers | Kamker Admin",
};

export const dynamic = "force-dynamic";

type WorkerRow = {
  id: string;
  full_name: string;
  phone_number: string | null;
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
  cnic: string | null;
  profile_photo_url: string | null;
  is_cnic_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  created_at: string;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type WorkersPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: "pending" | "approved" | "featured" | "cnic";
  }>;
};

async function getWorkers({
  q,
  status,
}: {
  q?: string;
  status?: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as WorkerRow[];
  }

  let query = supabase
    .from("professionals")
    .select("id, full_name, phone_number, whatsapp_number, area, gender, age, availability, years_experience, experience, expected_rate, tagline, short_bio, cnic, profile_photo_url, is_cnic_verified, is_phone_verified, is_active, is_featured, featured_until, created_at, cities(name), categories(name)")
    .order("created_at", { ascending: false })
    .limit(80);

  if (status === "pending") {
    query = query.eq("is_active", false);
  } else if (status === "approved") {
    query = query.eq("is_active", true);
  } else if (status === "featured") {
    query = query.eq("is_featured", true);
  } else if (status === "cnic") {
    query = query.eq("is_cnic_verified", true);
  }

  if (q) {
    const normalizedQ = pakistanMobileNormalizedDigits(q);
    const phoneSearch = normalizedQ ? `,phone_number.ilike.%${normalizedQ}%` : "";
    query = query.or(`full_name.ilike.%${q}%,phone_number.ilike.%${q}%${phoneSearch}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load admin workers", error);
    return [] as WorkerRow[];
  }

  return (data ?? []) as unknown as WorkerRow[];
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function duplicatePhoneGroups(workers: WorkerRow[]) {
  const groups = new Map<string, WorkerRow[]>();

  for (const worker of workers) {
    const normalized = pakistanMobileNormalizedDigits(worker.phone_number);

    if (!normalized) {
      continue;
    }

    groups.set(normalized, [...(groups.get(normalized) ?? []), worker]);
  }

  return Array.from(groups.entries()).filter(([, rows]) => rows.length > 1);
}

export default async function AdminWorkersPage({ searchParams }: WorkersPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const workers = await getWorkers({ q: params?.q, status: params?.status });
  const duplicatePhones = duplicatePhoneGroups(workers);

  return (
    <AdminShell
      active="/admin/workers"
      title="Workers"
      description="Review, approve, verify, feature, and remove individual worker profiles."
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Worker review queues need Supabase data. Local demo profiles are not shown here.
        </AdminWarning>
      ) : null}

      {duplicatePhones.length > 0 ? (
        <AdminWarning title="Duplicate worker phone numbers need cleanup">
          {duplicatePhones.length} phone number group{duplicatePhones.length === 1 ? "" : "s"} appear on more than one worker profile in this scan. Search the number, verify ownership proof, then use Remove Claimed Number on the wrong profile.
        </AdminWarning>
      ) : null}

      <AdminSection title="Search & Filters" description="Find profiles by name, phone, approval status, or verification status.">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            name="q"
            defaultValue={params?.q ?? ""}
            placeholder="Search name or phone"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          />
          <select
            name="status"
            defaultValue={params?.status ?? ""}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          >
            <option value="">All workers</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="featured">Featured</option>
            <option value="cnic">CNIC verified</option>
          </select>
          <Button>Filter</Button>
        </form>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/workers">Reset filters</Link>
          </Button>
        </div>
      </AdminSection>

      <AdminSection title="Worker Profiles" description={`${workers.length} profile${workers.length === 1 ? "" : "s"} loaded.`}>
        <div className="grid gap-4">
          {workers.length > 0 ? (
            workers.map((worker) => (
              <div key={worker.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-3">
                    <Image
                      src={worker.profile_photo_url ?? fallbackProfessionalImage()}
                      alt={`${worker.full_name} profile photo`}
                      width={72}
                      height={72}
                      className="size-16 rounded-full bg-accent object-cover"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{worker.full_name}</h2>
                        <AdminStatusBadge>{worker.is_active ? "Approved" : "Pending"}</AdminStatusBadge>
                        {worker.is_featured ? <Badge>Featured</Badge> : null}
                        {worker.is_cnic_verified ? <Badge variant="outline">CNIC verified</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {worker.categories?.name ?? "Professional"} - {worker.cities?.name ?? "Unknown city"}
                        {worker.area ? ` - ${worker.area}` : ""}
                      </p>
                      <p className="mt-2 text-sm font-medium">{worker.tagline ?? "No tagline added"}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full lg:w-auto">
                    <Link href={`/professionals/${worker.id}`}>View Public Profile</Link>
                  </Button>
                </div>

                <div className="mt-4">
                  <AdminMetaGrid
                    items={[
                      { label: "Phone", value: worker.phone_number ?? "Removed / not provided" },
                      { label: "WhatsApp", value: worker.whatsapp_number ?? "Not provided" },
                      { label: "Age", value: worker.age ?? "Not added" },
                      { label: "Gender", value: worker.gender ?? "Not provided" },
                      { label: "Availability", value: worker.availability ?? "Not provided" },
                      { label: "Hourly Rate", value: worker.expected_rate ?? "Not provided" },
                      { label: "Experience", value: `${worker.years_experience ?? 0} years` },
                      { label: "Phone Verified", value: worker.is_phone_verified ? "Yes" : "No" },
                      { label: "CNIC", value: worker.cnic ? "Provided" : "Not provided" },
                    ]}
                  />
                </div>

                {worker.short_bio ? (
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{worker.short_bio}</p>
                ) : null}

                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  <form action={approveProfessional}>
                    <input type="hidden" name="professionalId" value={worker.id} />
                    <Button className="w-full" disabled={!adminAuthenticated || worker.is_active}>Approve</Button>
                  </form>
                  <form action={rejectProfessional}>
                    <input type="hidden" name="professionalId" value={worker.id} />
                    <Button className="w-full" variant="outline" disabled={!adminAuthenticated || !worker.is_active}>Keep Pending</Button>
                  </form>
                  <form action={verifyCnic}>
                    <input type="hidden" name="professionalId" value={worker.id} />
                    <Button className="w-full" variant="outline" disabled={!adminAuthenticated || worker.is_cnic_verified}>Mark CNIC Verified</Button>
                  </form>
                  <form action={makeProfessionalFeatured} className="grid gap-2">
                    <input type="hidden" name="professionalId" value={worker.id} />
                    <input
                      name="featuredUntil"
                      type="date"
                      defaultValue={dateInputValue(worker.featured_until)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    />
                    <Button disabled={!adminAuthenticated}>Make Featured</Button>
                  </form>
                  <form action={removeProfessionalFeatured}>
                    <input type="hidden" name="professionalId" value={worker.id} />
                    <Button className="w-full" variant="outline" disabled={!adminAuthenticated || !worker.is_featured}>Remove Featured</Button>
                  </form>
                </div>

                <form action={deleteProfessional} className="mt-4 grid gap-2 rounded-lg border border-red-200 bg-red-50 p-3 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="professionalId" value={worker.id} />
                  <input
                    name="confirmDelete"
                    placeholder="Type DELETE to reject/delete"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button className="bg-red-600 text-white hover:bg-red-700" disabled={!adminAuthenticated}>
                    Reject/Delete Profile
                  </Button>
                </form>

                <form action={removeDisputedProfessionalNumber} className="mt-3 grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="professionalId" value={worker.id} />
                  <input
                    name="confirmRemoveNumber"
                    placeholder="Type REMOVE NUMBER after proof"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button className="bg-amber-600 text-white hover:bg-amber-700" disabled={!adminAuthenticated || !worker.phone_number}>
                    Remove Claimed Number
                  </Button>
                </form>
              </div>
            ))
          ) : (
            <AdminEmptyState>No worker profiles match this filter.</AdminEmptyState>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
