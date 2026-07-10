import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { BroadcastRequirementCta } from "@/components/broadcast-requirement-cta";
import { CategoryGrid } from "@/components/category-grid";
import { KamkerLogo } from "@/components/kamker-logo";
import { ProfessionalCard } from "@/components/professional-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  countForCategory,
  countNumberForCategory,
  getLiveCategoryCountMap,
} from "@/lib/category-counts";
import { getApprovedCompanyListingCards } from "@/lib/company-listing-cards";
import {
  categories,
  categorySlug,
  findCategoryBySlug,
  findServiceGroupBySlug,
  findServiceGroupForCategory,
  getGroupSubcategoryCards,
  parentCategories,
  recentProfessionals,
  searchTermsForCategory,
  type Professional,
} from "@/lib/marketplace-data";
import { getLocalProfessionalCards } from "@/lib/local-demo-store";
import {
  getCategoryIdsByNames,
  getCityIdByName,
} from "@/lib/public-directory-lookups";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const revalidate = 120;

type CategoryDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    city?: string;
    area?: string;
  }>;
};

type CategoryDbProfessional = {
  id: string;
  full_name: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  area: string | null;
  gender?: string | null;
  age?: number | null;
  availability?: string | null;
  years_experience?: number | null;
  experience: string | null;
  expected_rate: string | null;
  tagline: string | null;
  short_bio: string | null;
  profile_photo_url: string | null;
  is_featured: boolean;
  featured_until: string | null;
  rating: number | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type DbCategory = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parent_id: number | null;
};

async function getDbCategoryBySlug(slug: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description, parent_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Failed to load DB category by slug", error);
    return null;
  }

  return data as DbCategory | null;
}

async function getDbCategoryByName(name: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description, parent_id")
    .eq("name", name)
    .maybeSingle();

  if (error) {
    console.error("Failed to load DB category by name", error);
    return null;
  }

  return data as DbCategory | null;
}

async function getDbSubcategories(parentId: number) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as DbCategory[];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description, parent_id")
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load DB subcategories", error);
    return [] as DbCategory[];
  }

  return (data ?? []) as DbCategory[];
}

async function getDbParentCategory(parentId: number | null) {
  if (!parentId || !isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description, parent_id")
    .eq("id", parentId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load DB parent category", error);
    return null;
  }

  return data as DbCategory | null;
}

function normaliseMatchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function serviceMatchesCategory(serviceName: string, categoryName: string) {
  const service = normaliseMatchValue(serviceName);
  const categoryTerms = searchTermsForCategory(categoryName).map(normaliseMatchValue);

  return categoryTerms.some((category) => {
    const singularCategory = category.replace(/s$/, "");

    return (
      service.includes(category) ||
      service.includes(singularCategory) ||
      category.includes(service)
    );
  });
}

function professionalMatchesTargets(
  professional: Pick<Professional, "role" | "city" | "area">,
  targetCategories: string[],
  city?: string,
  area?: string,
) {
  const categoryMatch = targetCategories.some((targetCategory) =>
    serviceMatchesCategory(professional.role, targetCategory),
  );
  const cityMatch = city ? professional.city === city : true;
  const areaMatch = area
    ? normaliseMatchValue(professional.area).includes(normaliseMatchValue(area))
    : true;

  return categoryMatch && cityMatch && areaMatch;
}

function formatDbRate(value: string | null) {
  if (!value) {
    return "Contact for rate";
  }

  const lowerValue = value.toLowerCase();
  return lowerValue.includes("hour") || lowerValue.includes("day") || lowerValue.includes("month")
    ? value
    : `${value}/hour`;
}

function dbProfessionalToCard(professional: CategoryDbProfessional): Professional {
  return {
    id: professional.id,
    name: professional.full_name,
    phone: professional.phone_number,
    whatsapp: professional.whatsapp_number ?? professional.phone_number,
    role: professional.categories?.name ?? "Professional",
    city: professional.cities?.name ?? "Pakistan",
    area: professional.area ?? "Area not added",
    gender: professional.gender ?? "Verified",
    age: professional.age,
    availability: professional.availability ?? "Ask availability",
    rating: professional.rating ? professional.rating.toFixed(1) : "New",
    ratingCount: professional.rating ? "Verified reviews" : "New profile",
    experience: professional.years_experience
      ? `${professional.years_experience} years experience`
      : professional.experience ?? "Experience not added",
    rate: formatDbRate(professional.expected_rate),
    tagline: professional.tagline ?? professional.short_bio ?? "Available professional",
    bio: professional.short_bio ?? "Profile details will be updated soon.",
    responseTime: "Contact directly",
    image: professional.profile_photo_url ?? "/kamker-professionals.png",
    is_featured: professional.is_featured,
    featured_until: professional.featured_until,
  };
}

async function getCategoryProfessionals(
  targetCategories: string[],
  city?: string,
  area?: string,
) {
  if (!isSupabaseConfigured || !supabase) {
    const localProfessionals = await getLocalProfessionalCards();

    return [...localProfessionals, ...recentProfessionals].filter((professional) =>
      professionalMatchesTargets(professional, targetCategories, city, area),
    );
  }

  const [cityId, categoryIds] = await Promise.all([
    city ? getCityIdByName(city) : Promise.resolve(null),
    getCategoryIdsByNames(targetCategories),
  ]);

  if (city && cityId === null) {
    return [] as Professional[];
  }

  if (categoryIds.length === 0) {
    return [] as Professional[];
  }

  let query = supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, gender, age, availability, years_experience, experience, expected_rate, tagline, short_bio, profile_photo_url, is_featured, featured_until, rating, cities(name), categories(name)",
    )
    .eq("is_active", true)
    .or("is_banned.eq.false,is_banned.is.null")
    .in("category_id", categoryIds)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(18);

  if (cityId !== null) {
    query = query.eq("city_id", cityId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load category professionals", error);
    return [] as Professional[];
  }

  const dbProfessionals = ((data ?? []) as unknown as CategoryDbProfessional[])
    .map(dbProfessionalToCard)
    .filter((professional) =>
      professionalMatchesTargets(professional, targetCategories, city, area),
    );

  return dbProfessionals;
}

export function generateStaticParams() {
  return [...parentCategories, ...categories].map((category) => ({
    slug: categorySlug(category.name),
  }));
}

export async function generateMetadata({ params }: CategoryDetailPageProps) {
  const { slug } = await params;
  const serviceGroup = findServiceGroupBySlug(slug);
  const category = findCategoryBySlug(slug);
  const dbCategory =
    (await getDbCategoryBySlug(slug)) ??
    (serviceGroup ? await getDbCategoryByName(serviceGroup.name) : null);
  const name = serviceGroup?.name ?? category?.name ?? dbCategory?.name;

  return {
    title: name ? `${name} Professionals | Kamker` : "Category | Kamker",
    description: name
      ? `Find ${name} professionals on Kamker and prepare reviewed customer requirements.`
      : "Find professionals on Kamker.",
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const serviceGroup = findServiceGroupBySlug(slug);
  const category = findCategoryBySlug(slug);
  const dbCategory =
    (await getDbCategoryBySlug(slug)) ??
    (serviceGroup ? await getDbCategoryByName(serviceGroup.name) : null);
  const dbSubcategories = dbCategory?.parent_id === null ? await getDbSubcategories(dbCategory.id) : [];
  const dbParentCategory = dbCategory?.parent_id ? await getDbParentCategory(dbCategory.parent_id) : null;
  if (!serviceGroup && !category && !dbCategory) {
    notFound();
  }

  const city = query?.city?.trim() || undefined;
  const area = query?.area?.trim() || undefined;
  const parentGroup = category ? findServiceGroupForCategory(category.name) : null;
  const pageName = serviceGroup?.name ?? category?.name ?? dbCategory?.name ?? "Category";
  const pageDescription = serviceGroup
    ? serviceGroup.description
    : dbCategory
      ? dbCategory.description ?? "Browse approved professionals and prepare a reviewed requirement for this service category."
    : parentGroup
      ? `${category?.name} are part of ${parentGroup.name}. Browse matching professionals and prepare a reviewed requirement when needed.`
      : "Browse approved professionals and prepare a reviewed requirement for this service category.";
  const liveCountMap = await getLiveCategoryCountMap(
    [
      ...dbSubcategories,
      ...categories,
      ...parentCategories,
      ...(dbCategory ? [dbCategory] : []),
      ...(dbParentCategory ? [dbParentCategory] : []),
    ],
    { city, area },
  );
  const fallbackSubcategoryCards = serviceGroup
    ? getGroupSubcategoryCards(serviceGroup)
    : [];
  const mergedSubcategoryCards = [
    ...fallbackSubcategoryCards,
    ...dbSubcategories.map((subcategory) => ({
      name: subcategory.name,
      icon: subcategory.icon ?? "wrench",
      count: "0",
    })),
  ].filter((subcategory, index, list) => {
    const key = normaliseMatchValue(subcategory.name);
    return list.findIndex((item) => normaliseMatchValue(item.name) === key) === index;
  });
  const subcategoryCards = mergedSubcategoryCards.map((subcategory) => ({
    ...subcategory,
    count: countForCategory(subcategory, liveCountMap),
  }));
  const serviceGroupSubcategories = mergedSubcategoryCards.map(
    (subcategory) => subcategory.name,
  );
  const targetCategories = serviceGroup
    ? serviceGroupSubcategories
    : category
      ? [category.name]
      : dbCategory?.parent_id === null
        ? dbSubcategories.length > 0
          ? dbSubcategories.map((subcategory) => subcategory.name)
          : [dbCategory.name]
        : dbCategory
          ? [dbCategory.name]
      : [];
  const isParentCategoryPage = Boolean(serviceGroup || dbCategory?.parent_id === null);
  const isServiceGroupPage = Boolean(serviceGroup || dbCategory?.parent_id === null);
  const [matchingProfessionals, companyManagedProfessionals] = await Promise.all([
    getCategoryProfessionals(targetCategories, city, area),
    getApprovedCompanyListingCards({
      categories: serviceGroup ? undefined : targetCategories,
      serviceGroup: serviceGroup?.name,
      city,
      area,
      limit: 12,
    }),
  ]);
  const parentCategoryCountTarget = serviceGroup
    ? parentCategories.find((item) => item.name === serviceGroup.name)
    : null;
  const recipientCount = countNumberForCategory(
    dbCategory ?? category ?? parentCategoryCountTarget ?? { name: pageName, count: "0" },
    liveCountMap,
  );
  const visibleProfessionals = [...companyManagedProfessionals, ...matchingProfessionals].sort(
    (a, b) => Number(b.is_featured) - Number(a.is_featured),
  );
  const distinctParentRoles = new Set(
    visibleProfessionals
      .map((professional) => normaliseMatchValue(professional.role))
      .filter(Boolean),
  );
  const professionalPreview = isParentCategoryPage
    ? visibleProfessionals.filter(
        (professional, index, list) =>
          list.findIndex(
            (item) =>
              normaliseMatchValue(item.role) ===
              normaliseMatchValue(professional.role),
          ) === index,
      )
    : visibleProfessionals;
  const shouldShowProfessionalSection =
    !isParentCategoryPage ||
    (distinctParentRoles.size > 1 && professionalPreview.length > 0);
  const professionalSectionLabel = isParentCategoryPage
    ? "Featured professionals"
    : "Available professionals";
  const professionalSectionTitle = isParentCategoryPage
    ? `Featured ${pageName} professionals`
    : `${category?.name ?? dbCategory?.name ?? pageName} professionals`;
  const directoryHref = isParentCategoryPage
    ? "/categories"
    : `/professionals?category=${encodeURIComponent(category?.name ?? dbCategory?.name ?? "")}`;
  const directoryLabel = isParentCategoryPage ? "View all categories" : "View directory";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 pr-16 sm:px-6 sm:pr-20 lg:px-8 lg:pr-20">
          <KamkerLogo />
          <Button asChild variant="outline" size="sm">
            <Link href="/categories">
              <ArrowLeft aria-hidden="true" />
              Categories
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Badge variant="secondary">
          {serviceGroup || dbCategory?.parent_id === null ? "Service Group" : "Subcategory"}
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
          {isParentCategoryPage ? `${pageName} Services` : `${pageName} Professionals`}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {pageDescription}
        </p>

        {city || area ? (
          <div className="mt-4 flex w-fit items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {[area, city].filter(Boolean).join(", ")}
          </div>
        ) : null}

        <BroadcastRequirementCta
          count={recipientCount}
          category={serviceGroup?.name ?? parentGroup?.name ?? dbParentCategory?.name ?? category?.name ?? dbCategory?.name}
          subcategory={
            isParentCategoryPage
              ? undefined
              : category?.name ?? (dbCategory?.parent_id ? dbCategory.name : undefined)
          }
          city={city}
          area={area}
          scope={isServiceGroupPage ? "serviceGroup" : "category"}
        />

        {isParentCategoryPage ? (
          <Card className="mt-7 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Choose a specific service
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal">
                {pageName} services
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose one professional type inside {pageName} for a more
                targeted search or reviewed requirement.
              </p>
              <CategoryGrid categories={subcategoryCards} city={city} area={area} />
            </CardContent>
          </Card>
        ) : null}

        {shouldShowProfessionalSection ? (
          <section className="mt-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  {professionalSectionLabel}
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-normal">
                  {professionalSectionTitle}
                </h2>
              </div>
              <Button asChild variant="outline" className="h-11 w-full sm:w-auto">
                <Link href={directoryHref}>{directoryLabel}</Link>
              </Button>
            </div>

            {professionalPreview.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {professionalPreview.slice(0, 6).map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
                    professional={professional}
                    featured={professional.is_featured}
                  />
                ))}
              </div>
            ) : (
              <Card className="mt-5 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="font-semibold">No visible profiles yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Approved professionals will appear here. You can still send a
                    requirement so Kamker can match it when profiles are available.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        ) : null}

        {!isParentCategoryPage && (parentGroup || dbParentCategory) ? (
          <Card className="mt-8 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Parent service group
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {category?.name ?? dbCategory?.name} belongs to {parentGroup?.name ?? dbParentCategory?.name}. You can also prepare one broader reviewed requirement for this group.
              </p>
              <Button asChild className="mt-4 h-11 w-full sm:w-auto" variant="outline">
                <Link href={`/categories/${parentGroup ? categorySlug(parentGroup.name) : dbParentCategory?.slug}`}>
                  View {parentGroup?.name ?? dbParentCategory?.name}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              How it works
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="font-semibold">1. Describe need</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add service, city, area, timing, and contact details.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">2. Review request</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Kamker reviews submitted requirements before outreach.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-semibold">3. Broadcast later</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Paid broadcast can message all matching professionals later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
