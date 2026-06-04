import {
  type Professional,
  serviceGroups,
} from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type CompanyListingCardRow = {
  id: string;
  title: string;
  service_group: string | null;
  category: string;
  city: string;
  area: string | null;
  description: string | null;
  hourly_rate: number | null;
  monthly_rate: number | null;
  profile_photo_url: string | null;
  photo_url?: string | null;
  tagline: string | null;
  gender: string | null;
  availability: string | null;
  years_experience: number | null;
  phone: string | null;
  whatsapp: string | null;
  is_featured: boolean;
  created_at?: string | null;
  companies: { id: string; company_name: string; verification_status: string } | null;
};

function formatCompanyRate(listing: Pick<CompanyListingCardRow, "hourly_rate" | "monthly_rate">) {
  if (listing.hourly_rate) {
    return `Rs ${listing.hourly_rate.toLocaleString("en-PK")}/hour`;
  }

  if (listing.monthly_rate) {
    return `Rs ${listing.monthly_rate.toLocaleString("en-PK")}/month`;
  }

  return "Ask company for rate";
}

function inferredServiceGroup(category: string) {
  return serviceGroups.find((group) => group.subcategories.includes(category))?.name ?? null;
}

export function companyListingToProfessionalCard(listing: CompanyListingCardRow): Professional {
  const companyName = listing.companies?.company_name ?? "Company managed";

  return {
    id: `company-${listing.id}`,
    name: listing.title,
    role: listing.category,
    city: listing.city,
    area: listing.area ?? companyName,
    gender: listing.gender ?? "Company Managed",
    availability: listing.availability ?? "Ask availability",
    rating: "New",
    ratingCount: "Company managed",
    experience: `${listing.years_experience ?? 0} years experience`,
    rate: formatCompanyRate(listing),
    tagline: listing.tagline ?? "Company managed worker",
    bio: listing.description ?? "Company-managed professional profile.",
    responseTime: "Contact company directly",
    image: listing.profile_photo_url ?? listing.photo_url ?? "/kamker-professionals.png",
    is_featured: listing.is_featured,
    featured_until: listing.is_featured ? "2030-12-31" : null,
    phone: listing.phone,
    whatsapp: listing.whatsapp,
    profileHref: `/company-listings/${listing.id}`,
    is_company_managed: true,
    company_name: companyName,
    company_verified: listing.companies?.verification_status === "verified",
  };
}

export async function getApprovedCompanyListingCards(filters?: {
  categories?: string[];
  serviceGroup?: string;
  city?: string;
  area?: string;
  limit?: number;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as Professional[];
  }

  let query = supabase
    .from("company_listings")
    .select("id, title, service_group, category, city, area, description, hourly_rate, monthly_rate, profile_photo_url, photo_url, tagline, gender, availability, years_experience, phone, whatsapp, is_featured, created_at, companies(id, company_name, verification_status)")
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.categories?.length) {
    query = query.in("category", filters.categories);
  }

  if (filters?.serviceGroup) {
    query = query.eq("service_group", filters.serviceGroup);
  }

  if (filters?.city) {
    query = query.eq("city", filters.city);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load approved company listings", error);
    return [] as Professional[];
  }

  return ((data ?? []) as unknown as CompanyListingCardRow[])
    .filter((listing) => {
      const groupMatch = filters?.serviceGroup
        ? (listing.service_group ?? inferredServiceGroup(listing.category)) === filters.serviceGroup
        : true;
      const areaMatch = filters?.area
        ? (listing.area ?? "").toLowerCase().includes(filters.area.toLowerCase())
        : true;

      return groupMatch && areaMatch;
    })
    .map(companyListingToProfessionalCard);
}
