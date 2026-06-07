import {
  categories,
  categorySlug,
  cities,
  findServiceGroupForCategory,
  type Professional,
  serviceGroups,
} from "@/lib/marketplace-data";
import {
  getLocalCompanyListingRecords,
  getLocalCompanyRecordById,
  isLocalDemoStoreEnabled,
} from "@/lib/local-demo-store";
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
  age: number | null;
  availability: string | null;
  years_experience: number | null;
  phone: string | null;
  whatsapp: string | null;
  is_featured: boolean;
  created_at?: string | null;
  companies: {
    id: string;
    company_name: string;
    verification_status: string;
    logo_url?: string | null;
  } | null;
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

const mockCompanyNames = [
  "PakCare Services",
  "BlueLine Workforce",
  "CityServe Professionals",
  "Reliable Hands",
  "Kamran Agency",
];

const mockCompanyAreasByCity: Record<string, string[]> = {
  Karachi: ["Clifton", "Gulshan-e-Iqbal", "North Nazimabad"],
  Lahore: ["Gulberg", "Johar Town", "Model Town"],
  Islamabad: ["F-10", "G-11", "I-8"],
  Rawalpindi: ["Saddar", "Bahria Town", "Satellite Town"],
  Peshawar: ["Hayatabad", "University Road", "Cantt"],
};

function mockCompanyRate(categoryName: string, index: number) {
  const lowerName = categoryName.toLowerCase();

  if (lowerName.includes("teacher") || lowerName.includes("tutor")) {
    return { hourly_rate: null, monthly_rate: 12000 + index * 750 };
  }

  if (lowerName.includes("driver") || lowerName.includes("guard") || lowerName.includes("office")) {
    return { hourly_rate: null, monthly_rate: 35000 + index * 1000 };
  }

  return { hourly_rate: 600 + index * 30, monthly_rate: null };
}

const mockCompanyListingRows: CompanyListingCardRow[] = categories.map((category, index) => {
  const city = cities[(index + 2) % cities.length];
  const rates = mockCompanyRate(category.name, index);
  const serviceGroup = findServiceGroupForCategory(category.name)?.name ?? inferredServiceGroup(category.name);
  const companyIndex = index % mockCompanyNames.length;
  const companyName = mockCompanyNames[companyIndex];

  return {
    id: `mock-company-${categorySlug(category.name)}`,
    title: `${category.name} Team Member`,
    service_group: serviceGroup,
    category: category.name,
    city,
    area: (mockCompanyAreasByCity[city] ?? ["Central Area"])[index % 3],
    description: `${companyName} mock company-managed ${category.name.toLowerCase()} profile for package, featured, and directory preview testing.`,
    hourly_rate: rates.hourly_rate,
    monthly_rate: rates.monthly_rate,
    profile_photo_url: null,
    photo_url: null,
    tagline: `Company ${category.name.toLowerCase()}`.slice(0, 30),
    gender: index % 2 === 0 ? "Male" : "Female",
    age: 23 + (index % 25),
    availability: index % 2 === 0 ? "Full Time" : "On Call",
    years_experience: 3 + (index % 8),
    phone: `03${String(200000000 + index * 24681).slice(0, 9)}`,
    whatsapp: `923${String(200000000 + index * 24681).slice(0, 9)}`,
    is_featured: index % 5 === 0,
    created_at: "2030-01-01T00:00:00.000Z",
    companies: {
      id: `mock-company-${companyIndex + 1}`,
      company_name: companyName,
      verification_status: index % 4 === 0 ? "pending" : "verified",
    },
  };
});

function getMockCompanyListingCards(filters?: {
  categories?: string[];
  serviceGroup?: string;
  city?: string;
  area?: string;
  limit?: number;
}) {
  const cards = mockCompanyListingRows
    .filter((listing) => {
      const categoryMatch = filters?.categories?.length
        ? filters.categories.includes(listing.category)
        : true;
      const serviceGroupMatch = filters?.serviceGroup
        ? (listing.service_group ?? inferredServiceGroup(listing.category)) === filters.serviceGroup
        : true;
      const cityMatch = filters?.city ? listing.city === filters.city : true;
      const areaMatch = filters?.area
        ? (listing.area ?? "").toLowerCase().includes(filters.area.toLowerCase())
        : true;

      return categoryMatch && serviceGroupMatch && cityMatch && areaMatch;
    })
    .map(companyListingToProfessionalCard)
    .sort((first, second) => Number(second.is_featured) - Number(first.is_featured));

  return typeof filters?.limit === "number" ? cards.slice(0, filters.limit) : cards;
}

async function getLocalCompanyListingCards(filters?: {
  categories?: string[];
  serviceGroup?: string;
  city?: string;
  area?: string;
  limit?: number;
}) {
  const listings = await getLocalCompanyListingRecords();
  const rows = await Promise.all(
    listings.map(async (listing) => {
      const company = await getLocalCompanyRecordById(listing.company_id);

      return {
        id: listing.id,
        title: listing.title,
        service_group: listing.service_group,
        category: listing.category,
        city: listing.city,
        area: listing.area,
        description: listing.description,
        hourly_rate: listing.hourly_rate,
        monthly_rate: listing.monthly_rate,
        profile_photo_url: listing.profile_photo_url,
        tagline: listing.tagline,
        gender: listing.gender,
        age: listing.age,
        availability: listing.availability,
        years_experience: listing.years_experience,
        phone: listing.phone,
        whatsapp: listing.whatsapp,
        is_featured: listing.is_featured,
        created_at: listing.created_at,
        companies: company
          ? {
              id: company.id,
              company_name: company.company_name,
              verification_status: company.verification_status,
              logo_url: company.logo_url,
            }
          : null,
      } satisfies CompanyListingCardRow;
    }),
  );

  const cards = rows
    .filter((listing) => {
      const categoryMatch = filters?.categories?.length
        ? filters.categories.includes(listing.category)
        : true;
      const serviceGroupMatch = filters?.serviceGroup
        ? (listing.service_group ?? inferredServiceGroup(listing.category)) === filters.serviceGroup
        : true;
      const cityMatch = filters?.city ? listing.city === filters.city : true;
      const areaMatch = filters?.area
        ? (listing.area ?? "").toLowerCase().includes(filters.area.toLowerCase())
        : true;

      return categoryMatch && serviceGroupMatch && cityMatch && areaMatch;
    })
    .map(companyListingToProfessionalCard)
    .sort((first, second) => Number(second.is_featured) - Number(first.is_featured));

  return typeof filters?.limit === "number" ? cards.slice(0, filters.limit) : cards;
}

export function getMockCompanyListingById(id: string) {
  return mockCompanyListingRows.find((listing) => listing.id === id) ?? null;
}

export function getMockCompanyProfileById(id: string) {
  const listings = mockCompanyListingRows.filter((listing) => listing.companies?.id === id);
  const firstListing = listings[0];

  if (!firstListing?.companies) {
    return null;
  }

  return {
    id,
    company_name: firstListing.companies.company_name,
    category: "Workforce Company",
    city: firstListing.city,
    area: firstListing.area,
    contact_person: "Operations Manager",
    phone: firstListing.phone,
    whatsapp: firstListing.whatsapp,
    description:
      `${firstListing.companies.company_name} is a demo company profile showing company-managed staff profiles across Kamker categories.`,
    verification_status: firstListing.companies.verification_status,
    logo_url: firstListing.companies.logo_url ?? null,
  };
}

export function getMockCompanyListingsByCompanyId(companyId: string) {
  return mockCompanyListingRows.filter((listing) => listing.companies?.id === companyId);
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
    age: listing.age,
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
    company_id: listing.companies?.id ?? null,
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
    const localCards = isLocalDemoStoreEnabled
      ? await getLocalCompanyListingCards(filters)
      : [];
    const mockCards = getMockCompanyListingCards(filters);
    const combinedCards = [...localCards, ...mockCards];

    return typeof filters?.limit === "number"
      ? combinedCards.slice(0, filters.limit)
      : combinedCards;
  }

  let query = supabase
    .from("company_listings")
    .select("id, title, service_group, category, city, area, description, hourly_rate, monthly_rate, profile_photo_url, photo_url, tagline, gender, age, availability, years_experience, phone, whatsapp, is_featured, created_at, companies(id, company_name, verification_status, logo_url)")
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
    return getMockCompanyListingCards(filters);
  }

  if (!data || data.length === 0) {
    return getMockCompanyListingCards(filters);
  }

  return (data as unknown as CompanyListingCardRow[])
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
