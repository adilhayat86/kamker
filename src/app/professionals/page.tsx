import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

import { ProfessionalCard } from "@/components/professional-card";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  categories,
  cities,
  getActiveFeaturedProfessionals,
  isActiveFeaturedProfessional,
  recentProfessionals,
} from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Professionals | Kamker",
  description: "Browse verified Kamker professional profiles.",
};

type DbProfessional = {
  id: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string | null;
  area: string | null;
  gender?: string | null;
  availability?: string | null;
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

type ProfessionalsPageProps = {
  searchParams?: Promise<{
    q?: string;
    city?: string;
    category?: string;
    gender?: string;
    availability?: string;
    rate?: string;
    verified?: string;
    sort?: string;
    page?: string;
  }>;
};

const availabilityOptions = ["Full Time", "Part Time Morning", "Part Time Evening"];
const hourlyRateOptions = [
  { value: "under-300", label: "Under Rs. 300/hour", min: 0, max: 299 },
  { value: "300-500", label: "Rs. 300-500/hour", min: 300, max: 500 },
  { value: "500-1000", label: "Rs. 500-1,000/hour", min: 500, max: 1000 },
  { value: "1000-2000", label: "Rs. 1,000-2,000/hour", min: 1000, max: 2000 },
  { value: "2000-plus", label: "Rs. 2,000+/hour", min: 2000, max: Number.POSITIVE_INFINITY },
];
const pageSize = 20;

function matches(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

function normalise(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
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

function isVerified(professional: DbProfessional) {
  return professional.is_cnic_verified || professional.is_phone_verified;
}

function isDbFeatured(professional: DbProfessional) {
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

async function getDbProfessionals() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as DbProfessional[];
  }

  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, gender, availability, years_experience, experience, expected_rate, tagline, short_bio, profile_photo_url, is_cnic_verified, is_phone_verified, is_featured, featured_until, rating, created_at, cities(name), categories(name)",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Failed to load professionals", error);
    return [] as DbProfessional[];
  }

  return (data ?? []) as unknown as DbProfessional[];
}

function DbProfessionalCard({
  professional,
  featured = false,
}: {
  professional: DbProfessional;
  featured?: boolean;
}) {
  const whatsappNumber = professional.whatsapp_number ?? professional.phone_number;
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
          <Image
            src={professional.profile_photo_url || "/kamker-professionals.png"}
            alt={`${professional.full_name} profile photo`}
            width={88}
            height={88}
            loading="lazy"
            className="size-20 rounded-full bg-accent object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{professional.full_name}</h2>
                <p className="text-sm font-medium text-primary">
                  {professional.categories?.name ?? "Professional"}
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
            <p className="mt-2 text-sm text-muted-foreground">
              {professional.experience ??
                professional.short_bio ??
                "Experience will be updated soon."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{verifiedLabel}</Badge>
              <Badge variant="secondary">{formatHourlyRate(professional.expected_rate)}</Badge>
              {professional.availability ? (
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
                Availability: {professional.availability ?? "Ask professional"}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                {professional.rating ?? 0} · {professional.years_experience ?? 0} years experience
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="h-11">
            <a href={`tel:${professional.phone_number}`}>
              <Phone aria-hidden="true" />
              Call
            </a>
          </Button>
          <Button asChild className="h-11 bg-[#25d366] text-white hover:bg-[#21bd5b]">
            <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}>
              <MessageCircle aria-hidden="true" />
              WhatsApp
            </a>
          </Button>
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
  professional: DbProfessional;
  featured?: boolean;
}) {
  const whatsappNumber = professional.whatsapp_number ?? professional.phone_number;
  const tagline = professional.tagline ?? "Trusted local professional";

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
          <Image
            src={professional.profile_photo_url || "/kamker-professionals.png"}
            alt={`${professional.full_name} profile photo`}
            width={88}
            height={88}
            loading="lazy"
            className="size-20 shrink-0 rounded-full bg-accent object-cover"
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
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {tagline}
            </p>

            <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {professional.cities?.name ?? "Pakistan"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" aria-hidden="true" />
                {professional.availability ?? "Ask professional"}
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
          {professional.is_cnic_verified ? (
            <Badge variant="outline">CNIC Verified</Badge>
          ) : null}
          {professional.is_phone_verified ? (
            <Badge variant="outline">Phone Verified</Badge>
          ) : null}
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
          <Button asChild variant="outline" className="h-10 px-2">
            <a href={`tel:${professional.phone_number}`}>
              <Phone aria-hidden="true" />
              Call
            </a>
          </Button>
          <Button asChild className="h-10 bg-[#25d366] px-2 text-white hover:bg-[#21bd5b]">
            <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}>
              <MessageCircle aria-hidden="true" />
              WhatsApp
            </a>
          </Button>
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
  const availability = params?.availability?.trim() ?? "";
  const rate = params?.rate?.trim() ?? "";
  const verified = params?.verified === "true";
  const sort = params?.sort?.trim() || "featured";
  const currentPage = Math.max(Number(params?.page ?? "1") || 1, 1);

  const dbProfessionals = await getDbProfessionals();
  const filteredDbProfessionals = dbProfessionals
    .filter((professional) => {
      const keywordMatch = q
        ? matches(professional.full_name, q) ||
          matches(professional.area, q) ||
          matches(professional.experience, q) ||
          matches(professional.short_bio, q) ||
          matches(professional.expected_rate, q) ||
          matches(professional.categories?.name, q) ||
          matches(professional.cities?.name, q)
        : true;
      const cityMatch = city ? professional.cities?.name === city : true;
      const categoryMatch = category ? professional.categories?.name === category : true;
      const genderMatch = gender ? normalise(professional.gender) === normalise(gender) : true;
      const availabilityMatch = availability
        ? normalise(professional.availability) === normalise(availability)
        : true;
      const hourlyRateMatch = matchesHourlyRate(professional.expected_rate, rate);
      const verifiedMatch = verified ? isVerified(professional) : true;

      return (
        keywordMatch &&
        cityMatch &&
        categoryMatch &&
        genderMatch &&
        availabilityMatch &&
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
  const featuredDemoProfessionals = getActiveFeaturedProfessionals();
  const regularDemoProfessionals = recentProfessionals.filter(
    (professional) => !isActiveFeaturedProfessional(professional),
  );
  const activeProfessionals = hasDbProfessionals
    ? paginatedDbProfessionals
    : recentProfessionals;
  const pageHrefParams = { q, city, category, gender, availability, rate, verified: verified ? "true" : "", sort };

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
        {!hasDbProfessionals ? (
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

          <details className="mt-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Advanced filters
            </summary>
            <div className="mt-3 grid max-h-[20vh] gap-2 overflow-y-auto pr-1 sm:max-h-none sm:grid-cols-2 lg:grid-cols-7">
              <label className="grid gap-1">
                <span className="text-xs font-medium">City</span>
                <select
                  name="city"
                  defaultValue={city}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">All cities</option>
                  {cities.map((cityOption) => (
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
                <span className="text-xs font-medium">Availability</span>
                <select
                  name="availability"
                  defaultValue={availability}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Any time</option>
                  {availabilityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
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
            </div>
          </details>
        </form>

        {hasDbProfessionals ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Showing {activeProfessionals.length} of {filteredDbProfessionals.length} approved professional
            {filteredDbProfessionals.length === 1 ? "" : "s"}.
          </p>
        ) : null}

        {hasDbProfessionals && activeProfessionals.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed bg-white p-6 text-sm text-muted-foreground">
            No professionals found. Try changing filters.
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
            {hasDbProfessionals
              ? featuredDbProfessionals.map((professional) => (
                  <ConversionProfessionalCard
                    key={professional.id}
                    professional={professional}
                    featured
                  />
                ))
              : featuredDemoProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                    featured
                  />
                ))}
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
            {hasDbProfessionals
              ? regularDbProfessionals.map((professional) => (
                  <ConversionProfessionalCard
                    key={professional.id}
                    professional={professional}
                  />
                ))
              : regularDemoProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                  />
                ))}
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
