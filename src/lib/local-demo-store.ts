import { promises as fs } from "node:fs";
import path from "node:path";

import {
  type WorkerDayAvailability,
  type WorkerTimeAvailability,
  workerAvailabilitySummary,
} from "@/lib/worker-availability";
import type { Professional } from "@/lib/marketplace-data";

export type LocalProfessionalRecord = {
  id: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string | null;
  area: string | null;
  gender: string | null;
  availability: string | null;
  availability_time: WorkerTimeAvailability | null;
  availability_days: WorkerDayAvailability | null;
  years_experience: number | null;
  experience: string | null;
  expected_rate: string | null;
  tagline: string | null;
  short_bio: string | null;
  profile_photo_url: string | null;
  is_cnic_verified: boolean;
  is_phone_verified: boolean;
  is_featured: boolean;
  featured_until: string | null;
  rating: number | null;
  created_at: string;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type SaveLocalProfessionalInput = {
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string;
  cityName: string;
  area: string;
  categoryName: string;
  gender: string;
  availabilityTime: WorkerTimeAvailability;
  availabilityDays: WorkerDayAvailability;
  yearsExperience: number;
  experience: string;
  expectedRate: string;
  tagline: string;
  shortBio: string;
};

const localStoreDir = path.join(process.cwd(), ".kamker-local");
const localProfessionalsPath = path.join(localStoreDir, "professionals.json");

export const isLocalDemoStoreEnabled =
  process.env.NODE_ENV !== "production" &&
  process.env.KAMKER_LOCAL_DEMO_STORE !== "disabled";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function readLocalProfessionals() {
  try {
    const contents = await fs.readFile(localProfessionalsPath, "utf8");
    const parsed = JSON.parse(contents);

    return Array.isArray(parsed) ? (parsed as LocalProfessionalRecord[]) : [];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

export async function getLocalProfessionalRecords() {
  if (!isLocalDemoStoreEnabled) {
    return [];
  }

  return readLocalProfessionals();
}

export async function saveLocalProfessional(input: SaveLocalProfessionalInput) {
  if (!isLocalDemoStoreEnabled) {
    return null;
  }

  const existing = await readLocalProfessionals();
  const now = new Date();
  const record: LocalProfessionalRecord = {
    id: `${slugify(input.fullName) || "test-worker"}-${now.getTime()}`,
    full_name: input.fullName,
    phone_number: input.phoneNumber,
    whatsapp_number: input.whatsappNumber || null,
    area: input.area || null,
    gender: input.gender,
    availability: workerAvailabilitySummary(
      input.availabilityTime,
      input.availabilityDays,
    ),
    availability_time: input.availabilityTime,
    availability_days: input.availabilityDays,
    years_experience: input.yearsExperience,
    experience: input.experience || null,
    expected_rate: input.expectedRate,
    tagline: input.tagline,
    short_bio: input.shortBio || null,
    profile_photo_url: null,
    is_cnic_verified: false,
    is_phone_verified: false,
    is_featured: false,
    featured_until: null,
    rating: null,
    created_at: now.toISOString(),
    cities: { name: input.cityName },
    categories: { name: input.categoryName },
  };

  await fs.mkdir(localStoreDir, { recursive: true });
  await fs.writeFile(
    localProfessionalsPath,
    JSON.stringify([record, ...existing], null, 2),
    "utf8",
  );

  return record;
}

export function localRecordToProfessional(
  professional: LocalProfessionalRecord,
): Professional {
  return {
    id: professional.id,
    name: professional.full_name,
    role: professional.categories?.name ?? "Professional",
    city: professional.cities?.name ?? "Pakistan",
    area: professional.area ?? "Area not added",
    gender: professional.gender ?? "Verified",
    availability: professional.availability ?? "Ask availability",
    rating: professional.rating ? professional.rating.toFixed(1) : "New",
    ratingCount: professional.rating ? "Verified reviews" : "Local test profile",
    experience: professional.years_experience
      ? `${professional.years_experience} years experience`
      : professional.experience ?? "Experience not added",
    rate: professional.expected_rate ?? "Contact for rate",
    tagline: professional.tagline ?? "Local test professional",
    bio: professional.short_bio ?? "Local test profile.",
    responseTime: "Local test profile",
    image: professional.profile_photo_url ?? "/kamker-professionals.png",
    is_featured: professional.is_featured,
    featured_until: professional.featured_until,
  };
}

export async function getLocalProfessionalCards() {
  const records = await getLocalProfessionalRecords();

  return records.map(localRecordToProfessional);
}
