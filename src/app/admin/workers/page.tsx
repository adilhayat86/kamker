import Link from "next/link";
import { redirect } from "next/navigation";

import {
  approveProfessional,
  banProfessional,
  deleteProfessional,
  makeProfessionalFeatured,
  removeDisputedProfessionalNumber,
  rejectProfessional,
  removeProfessionalFeatured,
  unbanProfessional,
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
import { ProfilePhotoViewer } from "@/components/profile-photo-viewer";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { pakistanMobileNormalizedDigits } from "@/lib/phone";
import { fallbackProfessionalImage } from "@/lib/professional-photo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  isWorkerApproved,
  isWorkerBanned,
  isWorkerPending,
  workerStatusLabel,
} from "@/lib/worker-status";

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
  is_banned?: boolean | null;
  is_featured: boolean;
  featured_until: string | null;
  created_at: string;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type WorkersPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: "pending" | "approved" | "banned" | "featured" | "cnic";
    notice?: "worker-approved" | "worker-pending" | "worker-banned" | "worker-unbanned";
  }>;
};

const workerNoticeMessages = {
  "worker-approved": "Worker approved.",
  "worker-pending": "Worker moved to pending review.",
  "worker-banned": "Worker banned.",
  "worker-unbanned": "Worker unbanned and moved to pending review.",
} as const;

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

  const selectColumns =
    "id, full_name, phone_number, whatsapp_number, area, gender, age, availability, years_experience, experience, expected_rate, tagline, short_bio, cnic, profile_photo_url, is_cnic_verified, is_phone_verified, is_active, is_banned, is_featured, featured_until, created_at, cities(name), categories(name)";

  let query = supabase
    .from("professionals")
    .select(selectColumns)
    .order("created_at", { ascending: false })
    .limit(80);

  if (status === "pending") {
    query = query.eq("is_active", false).eq("is_banned", false);
  } else if (status === "approved") {
    query = query.eq("is_active", true).eq("is_banned", false);
  } else if (status === "banned") {
    query = query.eq("is_banned", true);
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

  let { data, error } = await query;

  if (error?.code === "42703") {
    let fallbackQuery = supabase
      .from("professionals")
      .select("id, full_name, phone_number, whatsapp_number, area, gender, age, availability, years_experience, experience, expected_rate, tagline, short_bio, cnic, profile_photo_url, is_cnic_verified, is_phone_verified, is_active, is_featured, featured_until, created_at, cities(name), categories(name)")
      .order("created_at", { ascending: false })
      .limit(80);

    if (status === "banned") {
      return [] as WorkerRow[];
    }

    if (status === "pending") {
      fallbackQuery = fallbackQuery.eq("is_active", false);
    } else if (status === "approved") {
      fallbackQuery = fallbackQuery.eq("is_active", true);
    } else if (status === "featured") {
      fallbackQuery = fallbackQuery.eq("is_featured", true);
    } else if (status === "cnic") {
      fallbackQuery = fallbackQuery.eq("is_cnic_verified", true);
    }

    if (q) {
      const normalizedQ = pakistanMobileNormalizedDigits(q);
      const phoneSearch = normalizedQ ? `,phone_number.ilike.%${normalizedQ}%` : "";
      fallbackQuery = fallbackQuery.or(`full_name.ilike.%${q}%,phone_number.ilike.%${q}%${phoneSearch}`);
    }

    const fallbackResult = await fallbackQuery;
    data = fallbackResult.data
      ? fallbackResult.data.map((worker) => ({ ...worker, is_banned: false }))
      : null;
    error = fallbackResult.error;
  }

  if (error) {
    console.error("Failed to load admin workers", error);
    return [] as WorkerRow[];
  }

  return (data ?? []) as unknown as WorkerRow[];
}

function featuredUntilLabel(value: string | null) {
  if (!value) {
    return "No expiry set";
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

function WorkerCard({
  worker,
  adminAuthenticated,
}: {
  worker: WorkerRow;
  adminAuthenticated: boolean;
}) {
  const statusLabel = workerStatusLabel(worker);
  const isPending = isWorkerPending(worker);
  const isApproved = isWorkerApproved(worker);
  const isBanned = isWorkerBanned(worker);
  const canFeature = adminAuthenticated && isApproved && !isBanned;
  let featureDisabledReason = "";

  if (isBanned) {
    featureDisabledReason = "Unban this worker before featuring.";
  } else if (!isApproved) {
    featureDisabledReason = "Approve this worker before featuring.";
  } else if (!adminAuthenticated) {
    featureDisabledReason = "Admin login is required.";
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <ProfilePhotoViewer
            src={worker.profile_photo_url ?? fallbackProfessionalImage()}
            alt={`${worker.full_name} profile photo`}
            width={72}
            height={72}
            buttonClassName="size-16"
            imageClassName="size-16"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{worker.full_name}</h2>
              <AdminStatusBadge>{statusLabel}</AdminStatusBadge>
              {worker.is_featured ? <Badge>Featured</Badge> : null}
              {worker.is_cnic_verified ? <Badge variant="outline">CNIC verified</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {worker.categories?.name ?? "Professional"} - {worker.cities?.name ?? "Unknown city"}
              {worker.area ? ` - ${worker.area}` : ""}
            </p>
            {worker.is_featured ? (
              <p className="mt-1 text-sm font-medium text-primary">
                Featured until {featuredUntilLabel(worker.featured_until)}
              </p>
            ) : null}
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
        {isPending ? (
          <form action={approveProfessional}>
            <input type="hidden" name="professionalId" value={worker.id} />
            <Button className="w-full" disabled={!adminAuthenticated}>Approve</Button>
          </form>
        ) : null}
        {isApproved ? (
          <form action={rejectProfessional}>
            <input type="hidden" name="professionalId" value={worker.id} />
            <Button className="w-full" variant="outline" disabled={!adminAuthenticated}>Move to Pending</Button>
          </form>
        ) : null}
        {isBanned ? (
          <form action={unbanProfessional}>
            <input type="hidden" name="professionalId" value={worker.id} />
            <Button className="w-full" disabled={!adminAuthenticated}>Unban to Pending</Button>
          </form>
        ) : (
          <form action={banProfessional}>
            <input type="hidden" name="professionalId" value={worker.id} />
            <Button className="w-full bg-amber-600 text-white hover:bg-amber-700" disabled={!adminAuthenticated}>Ban</Button>
          </form>
        )}
        <form action={verifyCnic}>
          <input type="hidden" name="professionalId" value={worker.id} />
          <Button className="w-full" variant="outline" disabled={!adminAuthenticated || worker.is_cnic_verified}>Mark CNIC Verified</Button>
        </form>
        <form action={makeProfessionalFeatured} className="grid gap-2">
          <input type="hidden" name="professionalId" value={worker.id} />
          <select
            name="featuredDurationDays"
            defaultValue="30"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            disabled={!canFeature}
          >
            <option value="30">1 month (30 days)</option>
            <option value="60">2 months (admin only)</option>
            <option value="365">1 year (365 days)</option>
          </select>
          <Button disabled={!canFeature}>
            {worker.is_featured ? "Extend Featured" : "Make Featured"}
          </Button>
          {featureDisabledReason ? (
            <p className="text-xs text-muted-foreground">{featureDisabledReason}</p>
          ) : null}
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
  );
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
  const unapprovedWorkers = workers.filter(isWorkerPending);
  const approvedWorkers = workers.filter(isWorkerApproved);
  const bannedWorkers = workers.filter(isWorkerBanned);
  const statusLabel =
    params?.status === "pending"
      ? "unapproved"
      : params?.status === "approved"
        ? "approved"
        : params?.status === "banned"
          ? "banned"
          : params?.status ?? "all";

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

      {params?.notice ? (
        <AdminWarning title="Worker status updated">
          {workerNoticeMessages[params.notice]}
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
            <option value="banned">Banned</option>
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

      <AdminSection
        title="Pending Review / Unapproved Workers"
        description={`${unapprovedWorkers.length} pending profile${unapprovedWorkers.length === 1 ? "" : "s"} loaded for the current ${statusLabel} filter. Approving a worker moves them into the Approved Workers section.`}
      >
        <div className="grid gap-4">
          {unapprovedWorkers.length > 0 ? (
            unapprovedWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} adminAuthenticated={adminAuthenticated} />
            ))
          ) : (
            <AdminEmptyState>No unapproved worker profiles match this filter.</AdminEmptyState>
          )}
        </div>
      </AdminSection>

      <AdminSection
        title="Banned Workers"
        description={`${bannedWorkers.length} banned profile${bannedWorkers.length === 1 ? "" : "s"} loaded for the current ${statusLabel} filter. Unban moves a worker back to pending review.`}
      >
        <div className="grid gap-4">
          {bannedWorkers.length > 0 ? (
            bannedWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} adminAuthenticated={adminAuthenticated} />
            ))
          ) : (
            <AdminEmptyState>No banned worker profiles match this filter.</AdminEmptyState>
          )}
        </div>
      </AdminSection>

      <AdminSection
        title="Approved Workers"
        description={`${approvedWorkers.length} approved profile${approvedWorkers.length === 1 ? "" : "s"} loaded for the current ${statusLabel} filter.`}
      >
        <div className="grid gap-4">
          {approvedWorkers.length > 0 ? (
            approvedWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} adminAuthenticated={adminAuthenticated} />
            ))
          ) : (
            <AdminEmptyState>No approved worker profiles match this filter.</AdminEmptyState>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
