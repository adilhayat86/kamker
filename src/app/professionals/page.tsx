import Link from "next/link";
import type { Metadata } from "next";
import {
  BadgeCheck,
  Clock,
  MapPin,
  Search,
  Send,
  Sparkles,
  Star,
} from "lucide-react";

import { ContactActionButton } from "@/components/contact-action-button";
import { ProfilePhotoViewer } from "@/components/profile-photo-viewer";
import { ProfessionalCard } from "@/components/professional-card";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCityOptions } from "@/lib/city-options";
import { trackedContactHref } from "@/lib/contact-tracking";
import {
  workerAvailabilitySummary,
  workerDayAvailabilityLabel,
  workerDayAvailabilityOptions,
  workerTimeAvailabilityLabel,
  workerTimeAvailabilityOptions,
} from "@/lib/worker-availability";
import { getApprovedCompanyListingCards } from "@/lib/company-listing-cards";
import {
  categories,
  isActiveFeaturedProfessional,
  recentProfessionals,
  type Professional,
} from "@/lib/marketplace-data";
import {
  getLocalProfessionalRecords,
  type LocalProfessionalRecord,
} from "@/lib/local-demo-store";
import { whatsappHref as buildWhatsappHref } from "@/lib/phone";
import {
  categoryNamesForSearch,
  getCategoryIdsByNames,
  getCityIdByName,
} from "@/lib/public-directory-lookups";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type DbProfessional = {
  id: string;
  full_name: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  area: string | null;
  gender?: string | null;
  age?: number | null;
  availability?: string | null;
  availability_time?: string | null;
  availability_days?: string | null;
  years_experience?: number | null;
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
  created_at?: string | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type DirectoryProfessional = DbProfessional | LocalProfessionalRecord;

type ProfessionalsPageProps = {
  searchParams?: Promise<{
    q?: string;
    city?: string;
    category?: string;
    gender?: string;
    age?: string;
    availabilityTime?: string;
    availabilityDays?: string;
    rate?: string;
    verified?: string;
    sort?: string;
    source?: string;
    page?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: ProfessionalsPageProps): Promise<Metadata> {
  const filters = await searchParams;
  const hasSearchFilters = Object.entries(filters ?? {}).some(
    ([key, value]) => key !== "page" && Boolean(value?.trim()),
  );

  return {
    title: "Professionals | Kamker",
    description: "Browse verified Kamker professional profiles.",
    alternates: {
      canonical: "/professionals",
    },
    robots: hasSearchFilters
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

const hourlyRateOptions = [
  { value: "under-300", label: "Under Rs. 300/hour", min: 0, max: 299 },
  { value: "300-500", label: "Rs. 300-500/hour", min: 300, max: 500 },
  { value: "500-1000", label: "Rs. 500-1,000/hour", min: 500, max: 1000 },
  { value: "under-1000", label: "Under Rs. 1,000/hour", min: 0, max: 1000 },
  { value: "1000-2000", label: "Rs. 1,000-2,000/hour", min: 1000, max: 2000 },
  { value: "2000-plus", label: "Rs. 2,000+/hour", min: 2000, max: Number.POSITIVE_INFINITY },
];
const ageRangeOptions = [
  { value: "18-25", label: "18-25", min: 18, max: 25 },
  { value: "26-35", label: "26-35", min: 26, max: 35 },
  { value: "36-45", label: "36-45", min: 36, max: 45 },
  { value: "46-plus", label: "46+", min: 46, max: 80 },
];
const pageSize = 20;

function matches(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

function normalise(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesSearchCategoryIntent(categoryName: string | null | undefined, query: string) {
  if (!categoryName || !query) {
    return false;
  }

  const categoryKey = normalise(categoryName);
  return categoryNamesForSearch(query).some(
    (matchedCategory) => normalise(matchedCategory) === categoryKey,
  );
}

function cityFromSearchIntent(query: string, cityOptions: string[]) {
  const queryKey = normalise(query);

  if (!queryKey) {
    return "";
  }

  return cityOptions.find((cityOption) => normalise(cityOption) === queryKey) ?? "";
}

function categoryFromSearchIntent(query: string) {
  return categoryNamesForSearch(query)[0] ?? "";
}

function buildSearchResultSummary({
  count,
  city,
  category,
}: {
  count: number;
  city: string;
  category: string;
}) {
  const countLabel = count.toLocaleString("en-PK");

  if (category && city) {
    return `Found ${countLabel} ${category} in ${city}`;
  }

  if (city) {
    return `Found ${countLabel} professional${count === 1 ? "" : "s"} in ${city}`;
  }

  if (category) {
    return `Found ${countLabel} ${category}`;
  }

  return `Found ${countLabel} approved professional${count === 1 ? "" : "s"}`;
}

function buildSearchRequirementHref({
  q,
  city,
  category,
  estimate,
}: {
  q: string;
  city: string;
  category: string;
  estimate: number;
}) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  } else if (q) {
    params.set("service", q);
  }

  if (city) {
    params.set("city", city);
  }

  params.set("estimate", String(Math.max(0, Math.floor(estimate))));
  params.set("source", "professionals-search");

  return `/send-requirement?${params.toString()}`;
}

function buildSearchRequirementLabel({
  count,
  city,
  category,
}: {
  count: number;
  city: string;
  category: string;
}) {
  const countLabel = count.toLocaleString("en-PK");

  if (category && city) {
    return `Send Requirement to ${countLabel} ${category} in ${city}`;
  }

  if (category) {
    return `Send Requirement to ${countLabel} ${category}`;
  }

  if (city) {
    return `Send Requirement to ${countLabel} professionals in ${city}`;
  }

  return `Send Requirement to ${countLabel} professionals`;
}

function parseHourlyRate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const compactValue = value.replace(/,/g, "");
  const match = compactValue.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function formatHourlyRate(value: string | null | undefined) {
  if (!value) {
    return "Rate not added";
  }

  const lowerValue = value.toLowerCase();
  if (lowerValue.includes("hour") || lowerValue.includes("hr")) {
    return value;
  }

  return `${value}/hour`;
}

function matchesHourlyRate(value: string | null | undefined, rateFilter: string) {
  if (!rateFilter) {
    return true;
  }

  const hourlyRate = parseHourlyRate(value);
  const selectedRange = hourlyRateOptions.find((option) => option.value === rateFilter);

  if (!selectedRange || hourlyRate === null) {
    return false;
  }

  return hourlyRate >= selectedRange.min && hourlyRate <= selectedRange.max;
}

function isVerified(professional: DirectoryProfessional) {
  return professional.is_cnic_verified || professional.is_phone_verified;
}

function matchesAgeRange(value: number | null | undefined, ageFilter: string) {
  if (!ageFilter) {
    return true;
  }

  const selectedRange = ageRangeOptions.find((option) => option.value === ageFilter);

  if (!selectedRange || typeof value !== "number") {
    return false;
  }

  return value >= selectedRange.min && value <= selectedRange.max;
}

function matchesCompanyProfessionalFilters(
  professional: Professional,
  filters: {
    q: string;
    city: string;
    category: string;
    gender: string;
    age: string;
    availabilityTime: string;
    availabilityDays: string;
    rate: string;
    verified: boolean;
  },
) {
  const keywordMatch = filters.q
    ? matches(professional.name, filters.q) ||
      matches(professional.area, filters.q) ||
      matches(professional.role, filters.q) ||
      matchesSearchCategoryIntent(professional.role, filters.q) ||
      matches(professional.tagline, filters.q) ||
      matches(professional.bio, filters.q) ||
      matches(professional.city, filters.q)
    : true;
  const cityMatch = filters.city ? professional.city === filters.city : true;
  const categoryMatch = filters.category ? professional.role === filters.category : true;
  const genderMatch = filters.gender ? normalise(professional.gender) === normalise(filters.gender) : true;
  const ageMatch = matchesAgeRange(professional.age, filters.age);
  const availabilityTimeMatch = filters.availabilityTime
    ? matches(
        professional.availability,
        workerTimeAvailabilityLabel(filters.availabilityTime),
      )
    : true;
  const availabilityDaysMatch = filters.availabilityDays
    ? matches(
        professional.availability,
        workerDayAvailabilityLabel(filters.availabilityDays),
      )
    : true;
  const hourlyRateMatch = matchesHourlyRate(professional.rate, filters.rate);
  const verifiedMatch = filters.verified
    ? professional.is_company_managed
      ? Boolean(professional.company_verified)
      : true
    : true;

  return (
    keywordMatch &&
    cityMatch &&
    categoryMatch &&
    genderMatch &&
    ageMatch &&
    availabilityTimeMatch &&
    availabilityDaysMatch &&
    hourlyRateMatch &&
    verifiedMatch
  );
}

function isDbFeatured(professional: DirectoryProfessional) {
  return (
    professional.is_featured &&
    Boolean(professional.featured_until) &&
    new Date(professional.featured_until as string) > new Date()
  );
}

function buildPageHref(params: Record<string, string>, page: number) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      nextParams.set(key, value);
    }
  });

  if (page > 1) {
    nextParams.set("page", String(page));
  }

  const query = nextParams.toString();
  return query ? `/professionals?${query}` : "/professionals";
}

async function getDbProfessionals({
  q,
  city,
  category,
  gender,
  age,
  availabilityTime,
  availabilityDays,
  rate,
  verified,
  sort,
}: {
  q: string;
  city: string;
  category: string;
  gender: string;
  age: string;
  availabilityTime: string;
  availabilityDays: string;
  rate: string;
  verified: boolean;
  sort: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return getLocalProfessionalRecords();
  }

  const categoryNames = category
    ? [category]
    : q
      ? categoryNamesForSearch(q)
      : [];
  const [cityId, categoryIds] = await Promise.all([
    city ? getCityIdByName(city) : Promise.resolve(null),
    getCategoryIdsByNames(categoryNames),
  ]);
  const selectedAgeRange = ageRangeOptions.find((option) => option.value === age);
  const selectedRateRange = hourlyRateOptions.find((option) => option.value === rate);

  let query = supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, gender, age, availability, availability_time, availability_days, years_experience, experience, expected_rate, tagline, short_bio, profile_photo_url, is_cnic_verified, is_phone_verified, is_featured, featured_until, rating, created_at, cities(name), categories(name)",
    )
    .eq("is_active", true);

  query = query.or("is_banned.eq.false,is_banned.is.null");

  if (city) {
    if (cityId === null) {
      return [] as DbProfessional[];
    }

    query = query.eq("city_id", cityId);
  }

  if (categoryNames.length > 0) {
    if (categoryIds.length === 0) {
      return [] as DbProfessional[];
    }

    query = query.in("category_id", categoryIds);
  }

  if (q && categoryNames.length === 0) {
    const safeQuery = q.replace(/[%(),]/g, " ").trim();
    if (safeQuery) {
      query = query.or(
        `full_name.ilike.%${safeQuery}%,area.ilike.%${safeQuery}%,experience.ilike.%${safeQuery}%,short_bio.ilike.%${safeQuery}%,tagline.ilike.%${safeQuery}%`,
      );
    }
  }

  if (gender) {
    query = query.ilike("gender", gender);
  }

  if (selectedAgeRange) {
    query = query.gte("age", selectedAgeRange.min).lte("age", selectedAgeRange.max);
  }

  if (availabilityTime) {
    query = query.eq("availability_time", availabilityTime);
  }

  if (availabilityDays) {
    query = query.eq("availability_days", availabilityDays);
  }

  if (verified) {
    query = query.or("is_cnic_verified.eq.true,is_phone_verified.eq.true");
  }

  if (sort === "experienced") {
    query = query.order("years_experience", { ascending: false, nullsFirst: false });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("is_featured", { ascending: false })
      .order("featured_until", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(5000);

  if (error) {
    console.error("Failed to load professionals", error);
    return [] as DbProfessional[];
  }

  const professionals = (data ?? []) as unknown as DbProfessional[];

  return selectedRateRange
    ? professionals
        .filter((professional) => matchesHourlyRate(professional.expected_rate, rate))
    : professionals;
}

function availabilityLabels(professional: DirectoryProfessional) {
  const timeLabel = workerTimeAvailabilityLabel(professional.availability_time);
  const daysLabel = workerDayAvailabilityLabel(professional.availability_days);
  const combinedLabel = workerAvailabilitySummary(
    professional.availability_time,
    professional.availability_days,
  );

  return {
    timeLabel,
    daysLabel,
    combinedLabel: combinedLabel || professional.availability || "Ask professional",
  };
}

function DbProfessionalCard({
  professional,
  featured = false,
}: {
  professional: DbProfessional;
  featured?: boolean;
}) {
  const contactPhone = professional.phone_number;
  const whatsappDisplay = professional.whatsapp_number ?? contactPhone;
  const whatsappLink = buildWhatsappHref(whatsappDisplay);
  const profilePath = `/professionals/${professional.id}`;
  const phoneLink = contactPhone ? `tel:${contactPhone}` : null;
  const trackedPhoneLink = trackedContactHref({
    href: phoneLink,
    eventType: "call_click",
    targetType: "professional",
    targetId: professional.id,
    path: profilePath,
    category: professional.categories?.name ?? "Professional",
    city: professional.cities?.name ?? "Pakistan",
  });
  const trackedWhatsappLink = trackedContactHref({
    href: whatsappLink,
    eventType: "whatsapp_click",
    targetType: "professional",
    targetId: professional.id,
    path: profilePath,
    category: professional.categories?.name ?? "Professional",
    city: professional.cities?.name ?? "Pakistan",
  });
  const { timeLabel, daysLabel, combinedLabel } = availabilityLabels(professional);
  const tagline = professional.tagline?.trim() || "Trusted local professional";
  const verifiedLabel = professional.is_cnic_verified
    ? "CNIC Verified"
    : professional.is_phone_verified
      ? "Phone Verified"
      : "Profile Reviewed";

  return (
    <Card
      className={
        featured
          ? "border-primary/30 bg-white shadow-md"
          : "bg-white shadow-sm"
      }
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <ProfilePhotoViewer
            src={professional.profile_photo_url || "/kamker-professionals.png"}
            alt={`${professional.full_name} profile photo`}
            width={88}
            height={88}
            buttonClassName="size-20"
            imageClassName="size-20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{professional.full_name}</h2>
                <p className="text-sm font-medium text-primary">
                  {professional.categories?.name ?? "Professional"}
                </p>
                <p className="mt-1 max-w-full truncate text-sm font-semibold text-foreground">
                  {tagline}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {featured ? (
                  <Badge className="gap-1 bg-[#f6c343] text-[#241a04] hover:bg-[#f6c343]">
                    <Sparkles className="size-3" aria-hidden="true" />
                    Featured
                  </Badge>
                ) : null}
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  Approved
                </Badge>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {professional.experience ??
                professional.short_bio ??
                "Experience will be updated soon."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{verifiedLabel}</Badge>
              <Badge variant="secondary">{formatHourlyRate(professional.expected_rate)}</Badge>
              {timeLabel ? (
                <Badge variant="secondary">{timeLabel}</Badge>
              ) : null}
              {daysLabel ? (
                <Badge variant="secondary">{daysLabel}</Badge>
              ) : null}
              {!timeLabel && !daysLabel && professional.availability ? (
                <Badge variant="secondary">{professional.availability}</Badge>
              ) : null}
              {professional.gender ? (
                <Badge variant="secondary">{professional.gender}</Badge>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {professional.cities?.name ?? "Pakistan"}
                {professional.area ? `, ${professional.area}` : ""}
              </span>
              <span>
                Hourly Rate: {professional.expected_rate ?? "Contact for rate"}
              </span>
              <span>
                Availability: {combinedLabel}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                {professional.rating ?? 0} · {professional.years_experience ?? 0} years experience
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ContactActionButton
            href={trackedPhoneLink ?? phoneLink}
            displayValue={contactPhone}
            type="call"
            className="h-11"
            variant="outline"
          />
          <ContactActionButton
            href={trackedWhatsappLink}
            displayValue={whatsappDisplay}
            type="whatsapp"
            className="h-11 bg-[#25d366] text-white hover:bg-[#21bd5b]"
          />
        </div>
        <Button asChild className="mt-2 h-11 w-full" variant="outline">
          <Link href={`/professionals/${professional.id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

void DbProfessionalCard;

function ConversionProfessionalCard({
  professional,
  featured = false,
}: {
  professional: DirectoryProfessional;
  featured?: boolean;
}) {
  const contactPhone = professional.phone_number;
  const whatsappDisplay = professional.whatsapp_number ?? contactPhone;
  const whatsappLink = buildWhatsappHref(whatsappDisplay);
  const profilePath = `/professionals/${professional.id}`;
  const phoneLink = contactPhone ? `tel:${contactPhone}` : null;
  const trackedPhoneLink = trackedContactHref({
    href: phoneLink,
    eventType: "call_click",
    targetType: "professional",
    targetId: professional.id,
    path: profilePath,
    category: professional.categories?.name ?? "Professional",
    city: professional.cities?.name ?? "Pakistan",
  });
  const trackedWhatsappLink = trackedContactHref({
    href: whatsappLink,
    eventType: "whatsapp_click",
    targetType: "professional",
    targetId: professional.id,
    path: profilePath,
    category: professional.categories?.name ?? "Professional",
    city: professional.cities?.name ?? "Pakistan",
  });
  const tagline = professional.tagline?.trim() || "Trusted local professional";
  const { combinedLabel } = availabilityLabels(professional);

  return (
    <Card
      className={
        featured
          ? "flex h-full flex-col border-primary/30 bg-white shadow-md"
          : "flex h-full flex-col bg-white shadow-sm"
      }
    >
      <CardContent className="flex h-full flex-col p-3.5 sm:p-4">
        <div className="flex gap-3.5">
          <ProfilePhotoViewer
            src={professional.profile_photo_url || "/kamker-professionals.png"}
            alt={`${professional.full_name} profile photo`}
            width={88}
            height={88}
            buttonClassName="size-20"
            imageClassName="size-20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-tight">
                  {professional.full_name}
                </h2>
                <p className="text-sm font-medium text-primary">
                  {professional.categories?.name ?? "Professional"}
                </p>
                <p className="mt-1 max-w-full truncate text-sm font-semibold text-foreground">
                  {tagline}
                </p>
              </div>
              {featured ? (
                <Badge className="gap-1 bg-[#f6c343] text-[#241a04] hover:bg-[#f6c343]">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Featured
                </Badge>
              ) : null}
            </div>

            <p className="mt-2 text-2xl font-bold leading-tight text-primary sm:text-3xl">
              {formatHourlyRate(professional.expected_rate)}
            </p>

            <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {professional.cities?.name ?? "Pakistan"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" aria-hidden="true" />
                {combinedLabel}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                {professional.years_experience ?? 0} Years Experience
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
          {professional.gender ? (
            <Badge variant="secondary">{professional.gender}</Badge>
          ) : null}
          <Badge variant="secondary">
            {professional.age ? `Age ${professional.age}` : "Age not added"}
          </Badge>
          {professional.is_cnic_verified ? (
            <Badge variant="outline">CNIC Verified</Badge>
          ) : null}
          {professional.is_phone_verified ? (
            <Badge variant="outline">Phone Verified</Badge>
          ) : null}
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
          <ContactActionButton
            href={trackedPhoneLink ?? phoneLink}
            displayValue={contactPhone}
            type="call"
            className="h-10 px-2"
            variant="outline"
          />
          <ContactActionButton
            href={trackedWhatsappLink}
            displayValue={whatsappDisplay}
            type="whatsapp"
            className="h-10 bg-[#25d366] px-2 text-white hover:bg-[#21bd5b]"
          />
          <Button asChild className="h-10 px-2" variant="outline">
            <Link href={`/professionals/${professional.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ProfessionalsPage({
  searchParams,
}: ProfessionalsPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const city = params?.city?.trim() ?? "";
  const category = params?.category?.trim() ?? "";
  const gender = params?.gender?.trim() ?? "";
  const age = params?.age?.trim() ?? "";
  const availabilityTime = params?.availabilityTime?.trim() ?? "";
  const availabilityDays = params?.availabilityDays?.trim() ?? "";
  const rate = params?.rate?.trim() ?? "";
  const verified = params?.verified === "true";
  const sort = params?.sort?.trim() || "featured";
  const currentPage = Math.max(Number(params?.page ?? "1") || 1, 1);
  const cityOptions = await getCityOptions();
  const inferredCity = city || cityFromSearchIntent(q, cityOptions);
  const searchTermIsCityOnly = Boolean(!city && q && inferredCity);
  const effectiveSearchQuery = searchTermIsCityOnly ? "" : q;
  const effectiveCity = inferredCity || city;
  const queryCategoryNames = category
    ? [category]
    : effectiveSearchQuery
      ? categoryNamesForSearch(effectiveSearchQuery)
      : [];

  const [dbProfessionals, companyProfessionals] = await Promise.all([
    getDbProfessionals({
      q: effectiveSearchQuery,
      city: effectiveCity,
      category,
      gender,
      age,
      availabilityTime,
      availabilityDays,
      rate,
      verified,
      sort,
    }),
    getApprovedCompanyListingCards({
      categories: queryCategoryNames.length > 0 ? queryCategoryNames : undefined,
      city: effectiveCity || undefined,
      limit: 5000,
    }),
  ]);
  const filteredCompanyProfessionals = companyProfessionals.filter((professional) =>
    matchesCompanyProfessionalFilters(professional, {
      q: effectiveSearchQuery,
      city: effectiveCity,
      category,
      gender,
      age,
      availabilityTime,
      availabilityDays,
      rate,
      verified,
    }),
  );
  const filteredDemoProfessionals = recentProfessionals.filter((professional) =>
    matchesCompanyProfessionalFilters(professional, {
      q: effectiveSearchQuery,
      city: effectiveCity,
      category,
      gender,
      age,
      availabilityTime,
      availabilityDays,
      rate,
      verified,
    }),
  );
  const filteredDbProfessionals = dbProfessionals
    .filter((professional) => {
      const keywordMatch = effectiveSearchQuery
        ? matches(professional.full_name, effectiveSearchQuery) ||
          matches(professional.area, effectiveSearchQuery) ||
          matches(professional.experience, effectiveSearchQuery) ||
          matches(professional.short_bio, effectiveSearchQuery) ||
          matches(professional.expected_rate, effectiveSearchQuery) ||
          matches(professional.categories?.name, effectiveSearchQuery) ||
          matchesSearchCategoryIntent(professional.categories?.name, effectiveSearchQuery) ||
          matches(professional.cities?.name, effectiveSearchQuery)
        : true;
      const cityMatch = effectiveCity ? professional.cities?.name === effectiveCity : true;
      const categoryMatch = category ? professional.categories?.name === category : true;
      const genderMatch = gender ? normalise(professional.gender) === normalise(gender) : true;
      const ageMatch = matchesAgeRange(professional.age, age);
      const hourlyRateMatch = matchesHourlyRate(professional.expected_rate, rate);
      const verifiedMatch = verified ? isVerified(professional) : true;

      return (
        keywordMatch &&
        cityMatch &&
        categoryMatch &&
        genderMatch &&
        ageMatch &&
        hourlyRateMatch &&
        verifiedMatch
      );
    })
    .sort((a, b) => {
      if (sort === "experienced") {
        return (b.years_experience ?? 0) - (a.years_experience ?? 0);
      }

      if (sort === "rate-low") {
        return (parseHourlyRate(a.expected_rate) ?? Number.POSITIVE_INFINITY) - (parseHourlyRate(b.expected_rate) ?? Number.POSITIVE_INFINITY);
      }

      if (sort === "rate-high") {
        return (parseHourlyRate(b.expected_rate) ?? 0) - (parseHourlyRate(a.expected_rate) ?? 0);
      }

      if (sort === "newest") {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }

      const featuredDiff = Number(isDbFeatured(b)) - Number(isDbFeatured(a));
      if (featuredDiff !== 0) {
        return featuredDiff;
      }

      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });

  const hasDbProfessionals = dbProfessionals.length > 0;
  const hasDirectoryProfessionals =
    hasDbProfessionals ||
    filteredCompanyProfessionals.length > 0 ||
    filteredDemoProfessionals.length > 0;
  const totalPages = Math.max(Math.ceil(filteredDbProfessionals.length / pageSize), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedDbProfessionals = filteredDbProfessionals.slice(
    startIndex,
    startIndex + pageSize,
  );
  const featuredDbProfessionals = paginatedDbProfessionals.filter(isDbFeatured);
  const regularDbProfessionals = paginatedDbProfessionals.filter(
    (professional) => !isDbFeatured(professional),
  );
  const featuredCompanyProfessionals = filteredCompanyProfessionals.filter(
    (professional) => professional.is_featured,
  );
  const regularCompanyProfessionals = filteredCompanyProfessionals.filter(
    (professional) => !professional.is_featured,
  );
  const featuredDemoProfessionals = filteredDemoProfessionals.filter((professional) =>
    isActiveFeaturedProfessional(professional),
  );
  const regularDemoProfessionals = filteredDemoProfessionals.filter(
    (professional) => !isActiveFeaturedProfessional(professional),
  );
  const activeProfessionals = hasDbProfessionals
    ? [...featuredCompanyProfessionals, ...regularCompanyProfessionals, ...paginatedDbProfessionals]
    : [...featuredCompanyProfessionals, ...regularCompanyProfessionals, ...filteredDemoProfessionals];
  const totalVisibleProfessionals =
    filteredDbProfessionals.length +
    filteredCompanyProfessionals.length +
    (hasDbProfessionals ? 0 : filteredDemoProfessionals.length);
  const inferredCategory = category || categoryFromSearchIntent(effectiveSearchQuery);
  const resultSummary = buildSearchResultSummary({
    count: totalVisibleProfessionals,
    city: inferredCity,
    category: inferredCategory,
  });
  const sendRequirementHref = buildSearchRequirementHref({
    q: effectiveSearchQuery,
    city: inferredCity,
    category: inferredCategory,
    estimate: totalVisibleProfessionals,
  });
  const sendRequirementLabel = buildSearchRequirementLabel({
    count: totalVisibleProfessionals,
    city: inferredCity,
    category: inferredCategory,
  });
  const pageHrefParams = {
    q,
    city,
    category,
    gender,
    age,
    availabilityTime,
    availabilityDays,
    rate,
    verified: verified ? "true" : "",
    sort,
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <PageNavigation backHref="/categories" backLabel="Categories" />
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Professionals
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse approved local professionals by hourly rate and contact them directly without a middleman.
        </p>
        {!hasDirectoryProfessionals ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Demo listings are shown until approved professionals are added in Supabase.
          </p>
        ) : null}

        <form className="mt-6 rounded-lg border bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="grid gap-1">
              <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                Search professionals
              </span>
              <Input
                className="h-10"
                name="q"
                placeholder="Nurse, driver, area, name"
                defaultValue={q}
              />
            </label>
            <Button className="h-10 self-end" type="submit">
              <Search aria-hidden="true" />
              Search
            </Button>
            <Button asChild className="h-10 self-end" variant="outline">
              <Link href="/professionals">Clear</Link>
            </Button>
          </div>

          <details className="mt-2 rounded-md border border-sky-100 bg-sky-50/50 px-3 py-2 text-sm">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Filters: city, category, age, rate, availability
            </summary>
            <div className="mt-3 grid max-h-[24vh] gap-2 overflow-y-auto pr-1 sm:max-h-none sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-1">
                <span className="text-xs font-medium">City</span>
                <select
                  name="city"
                  defaultValue={city}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">All cities</option>
                  {cityOptions.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>
                      {cityOption}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Category</span>
                <select
                  name="category"
                  defaultValue={category}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((categoryOption) => (
                    <option key={categoryOption.name} value={categoryOption.name}>
                      {categoryOption.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Gender</span>
                <select
                  name="gender"
                  defaultValue={gender}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Work time</span>
                <select
                  name="availabilityTime"
                  defaultValue={availabilityTime}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any time</option>
                  {workerTimeAvailabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Age</span>
                <select
                  name="age"
                  defaultValue={age}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any age</option>
                  {ageRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Work days</span>
                <select
                  name="availabilityDays"
                  defaultValue={availabilityDays}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any days</option>
                  {workerDayAvailabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Hourly Rate</span>
                <select
                  name="rate"
                  defaultValue={rate}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any rate</option>
                  {hourlyRateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium">Sort</span>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="featured">Featured first</option>
                  <option value="newest">Recently added</option>
                  <option value="experienced">Most experienced</option>
                  <option value="rate-low">Lowest hourly rate</option>
                  <option value="rate-high">Highest hourly rate</option>
                </select>
              </label>
              <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                <input
                  type="checkbox"
                  name="verified"
                  value="true"
                  defaultChecked={verified}
                  className="size-4"
                />
                Verified only
              </label>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-4">
                <Button className="h-10" type="submit">
                  Apply filters
                </Button>
                <Button asChild className="h-10" variant="outline">
                  <Link href="/professionals">Reset filters</Link>
                </Button>
              </div>
            </div>
          </details>
        </form>

        {totalVisibleProfessionals > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-sky-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-foreground">
                {resultSummary}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing {activeProfessionals.length} on this page.
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Send Requirement is a paid outreach option after Kamker review.
              </p>
            </div>
            <Button asChild className="h-11 w-full sm:w-auto">
              <Link href={sendRequirementHref}>
                <Send aria-hidden="true" />
                {sendRequirementLabel}
              </Link>
            </Button>
          </div>
        ) : null}

        {totalVisibleProfessionals === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed bg-white p-6 text-sm text-muted-foreground">
            <p>No professionals found. Try changing filters.</p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Paid outreach can still be requested after Kamker reviews your
              details.
            </p>
            <Button asChild className="mt-4 h-11 w-full sm:w-auto" variant="outline">
              <Link href={sendRequirementHref}>
                <Send aria-hidden="true" />
                Send Requirement anyway
              </Link>
            </Button>
          </div>
        ) : null}

        <section className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Featured professionals
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal">
            Active featured profiles
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCompanyProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                featured
              />
            ))}
            {featuredDbProfessionals.map((professional) => (
              <ConversionProfessionalCard
                key={professional.id}
                professional={professional}
                featured
              />
            ))}
            {!hasDbProfessionals
              ? featuredDemoProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                    featured
                  />
                ))
              : null}
          </div>
        </section>

        <section className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Directory
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal">
            Regular profiles
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regularCompanyProfessionals.map((professional) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
              />
            ))}
            {regularDbProfessionals.map((professional) => (
              <ConversionProfessionalCard
                key={professional.id}
                professional={professional}
              />
            ))}
            {!hasDbProfessionals
              ? regularDemoProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                  />
                ))
              : null}
          </div>
        </section>

        {hasDbProfessionals && totalPages > 1 ? (
          <nav className="mt-8 flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm shadow-sm">
            <Button asChild variant="outline" className="h-10" disabled={safeCurrentPage <= 1}>
              <Link href={buildPageHref(pageHrefParams, safeCurrentPage - 1)}>Previous</Link>
            </Button>
            <span className="font-medium text-muted-foreground">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <Button asChild variant="outline" className="h-10" disabled={safeCurrentPage >= totalPages}>
              <Link href={buildPageHref(pageHrefParams, safeCurrentPage + 1)}>Next</Link>
            </Button>
          </nav>
        ) : null}
      </section>
    </main>
  );
}
