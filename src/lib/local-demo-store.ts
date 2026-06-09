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
  age: number | null;
  availability: string | null;
  availability_time: WorkerTimeAvailability | null;
  availability_days: WorkerDayAvailability | null;
  years_experience: number | null;
  experience: string | null;
  expected_rate: string | null;
  tagline: string | null;
  short_bio: string | null;
  profile_photo_url: string | null;
  password_hash: string | null;
  secret_question: string | null;
  secret_answer_hash: string | null;
  is_cnic_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  rating: number | null;
  created_at: string;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

export type LocalCompanyRecord = {
  id: string;
  company_name: string;
  category: string;
  city: string;
  area: string | null;
  contact_person: string | null;
  phone: string | null;
  whatsapp: string | null;
  description: string | null;
  license_number: string | null;
  payment_status: string;
  verification_status: string;
  logo_url: string | null;
  created_at: string;
};

export type LocalCompanyListingRecord = {
  id: string;
  company_id: string;
  title: string;
  service_group: string;
  category: string;
  city: string;
  area: string | null;
  tagline: string | null;
  gender: string | null;
  age: number | null;
  availability: string | null;
  years_experience: number | null;
  description: string | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  profile_photo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
};

type SaveLocalProfessionalInput = {
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string;
  cityName: string;
  area: string;
  categoryName: string;
  gender: string;
  age: number;
  availabilityTime: WorkerTimeAvailability;
  availabilityDays: WorkerDayAvailability;
  yearsExperience: number;
  experience: string;
  expectedRate: string;
  tagline: string;
  shortBio: string;
  passwordHash?: string | null;
  secretQuestion?: string | null;
  secretAnswerHash?: string | null;
};

const localStoreDir = path.join(process.cwd(), ".kamker-local");
const localProfessionalsPath = path.join(localStoreDir, "professionals.json");
const localCompaniesPath = path.join(localStoreDir, "companies.json");
const localCompanyListingsPath = path.join(
  localStoreDir,
  "company-listings.json",
);

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

async function readLocalJsonFile<T>(filePath: string) {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(contents.replace(/^\uFEFF/, ""));

    if (Array.isArray(parsed)) {
      return parsed as T[];
    }

    return parsed && typeof parsed === "object" ? [parsed as T] : [];
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

async function writeLocalJsonFile<T>(filePath: string, records: T[]) {
  await fs.mkdir(localStoreDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(records, null, 2), "utf8");
}

export async function getLocalProfessionalRecordById(id: string) {
  const records = await getLocalProfessionalRecords();

  return records.find((professional) => professional.id === id) ?? null;
}

export async function deleteLocalProfessionalRecordById(id: string) {
  if (!isLocalDemoStoreEnabled) {
    return false;
  }

  const records = await readLocalProfessionals();
  const nextRecords = records.filter((professional) => professional.id !== id);

  if (nextRecords.length === records.length) {
    return false;
  }

  await writeLocalJsonFile(localProfessionalsPath, nextRecords);
  return true;
}

export async function getLocalCompanyRecords() {
  if (!isLocalDemoStoreEnabled) {
    return [];
  }

  return readLocalJsonFile<LocalCompanyRecord>(localCompaniesPath);
}

export async function getLocalCompanyRecordById(id: string) {
  const records = await getLocalCompanyRecords();

  return records.find((company) => company.id === id) ?? null;
}

export async function getLocalCompanyListingRecords(companyId?: string) {
  if (!isLocalDemoStoreEnabled) {
    return [];
  }

  const records = await readLocalJsonFile<LocalCompanyListingRecord>(
    localCompanyListingsPath,
  );

  return companyId
    ? records.filter((listing) => listing.company_id === companyId)
    : records;
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
    age: input.age,
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
    password_hash: input.passwordHash ?? null,
    secret_question: input.secretQuestion ?? null,
    secret_answer_hash: input.secretAnswerHash ?? null,
    is_cnic_verified: false,
    is_phone_verified: false,
    is_active: true,
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

export async function saveLocalCompany(input: {
  companyName: string;
  category: string;
  city: string;
  area: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  licenseNumber: string;
  description: string;
}) {
  if (!isLocalDemoStoreEnabled) {
    return null;
  }

  const existing = await getLocalCompanyRecords();
  const now = new Date();
  const record: LocalCompanyRecord = {
    id: `local-company-${slugify(input.companyName) || "demo"}-${now.getTime()}`,
    company_name: input.companyName,
    category: input.category,
    city: input.city,
    area: input.area || null,
    contact_person: input.contactPerson || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    description: input.description || null,
    license_number: input.licenseNumber || null,
    payment_status: "local-demo-active",
    verification_status: "local-demo",
    logo_url: null,
    created_at: now.toISOString(),
  };

  await writeLocalJsonFile(localCompaniesPath, [record, ...existing]);

  return record;
}

export async function saveLocalCompanyListing(input: {
  companyId: string;
  title: string;
  serviceGroup: string;
  category: string;
  city: string;
  area: string;
  tagline: string;
  gender: string;
  age: number;
  availability: string;
  yearsExperience: number | null;
  description: string;
  hourlyRate: number | null;
  monthlyRate: number | null;
  profilePhotoUrl: string;
  phone: string;
  whatsapp: string;
}) {
  if (!isLocalDemoStoreEnabled) {
    return null;
  }

  const existing = await getLocalCompanyListingRecords();
  const now = new Date();
  const record: LocalCompanyListingRecord = {
    id: `local-company-listing-${slugify(input.title) || "worker"}-${now.getTime()}`,
    company_id: input.companyId,
    title: input.title,
    service_group: input.serviceGroup,
    category: input.category,
    city: input.city,
    area: input.area || null,
    tagline: input.tagline,
    gender: input.gender || null,
    age: input.age,
    availability: input.availability || null,
    years_experience: input.yearsExperience,
    description: input.description || null,
    hourly_rate: input.hourlyRate,
    monthly_rate: input.monthlyRate,
    profile_photo_url: input.profilePhotoUrl || null,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    status: "approved",
    is_featured: false,
    created_at: now.toISOString(),
  };

  await writeLocalJsonFile(localCompanyListingsPath, [record, ...existing]);

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
    age: professional.age,
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
