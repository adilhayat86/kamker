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
import { getBroadcastRecipientCount } from "@/lib/broadcast";
import {
  categories,
  categorySlug,
  findCategoryBySlug,
  findServiceGroupBySlug,
  findServiceGroupForCategory,
  getGroupSubcategoryCards,
  parentCategories,
  recentProfessionals,
  type Professional,
} from "@/lib/marketplace-data";
import { getLocalProfessionalCards } from "@/lib/local-demo-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
  area: string | null;
  gender?: string | null;
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

function normaliseMatchValue(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function serviceMatchesCategory(serviceName: string, categoryName: string) {
  const service = normaliseMatchValue(serviceName);
  const category = normaliseMatchValue(categoryName);
  const singularCategory = category.replace(/s$/, "");

  return (
    service.includes(category) ||
    service.includes(singularCategory) ||
    category.includes(service)
  );
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
    role: professional.categories?.name ?? "Professional",
    city: professional.cities?.name ?? "Pakistan",
    area: professional.area ?? "Area not added",
    gender: professional.gender ?? "Verified",
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

  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, full_name, area, gender, availability, years_experience, experience, expected_rate, tagline, short_bio, profile_photo_url, is_featured, featured_until, rating, cities(name), categories(name)",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("Failed to load category professionals", error);
    return recentProfessionals.filter((professional) =>
      professionalMatchesTargets(professional, targetCategories, city, area),
    );
  }

  const dbProfessionals = ((data ?? []) as unknown as CategoryDbProfessional[])
    .map(dbProfessionalToCard)
    .filter((professional) =>
      professionalMatchesTargets(professional, targetCategories, city, area),
    );

  return dbProfessionals.length > 0
    ? dbProfessionals
    : recentProfessionals.filter((professional) =>
        professionalMatchesTargets(professional, targetCategories, city, area),
      );
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
  const name = serviceGroup?.name ?? category?.name;

  return {
    title: name ? `${name} Professionals | Kamker` : "Category | Kamker",
    description: name
      ? `Find and send requirements to ${name} professionals on Kamker.`
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

  if (!serviceGroup && !category) {
    notFound();
  }

  const city = query?.city?.trim() || undefined;
  const area = query?.area?.trim() || undefined;
  const parentGroup = category ? findServiceGroupForCategory(category.name) : null;
  const pageName = serviceGroup?.name ?? category?.name ?? "Category";
  const pageDescription = serviceGroup
    ? serviceGroup.description
    : parentGroup
      ? `${category?.name} are part of ${parentGroup.name}. Send one requirement and reach approved matching professionals.`
      : "Send one requirement and reach approved professionals matching this service category.";
  const subcategoryCards = serviceGroup ? getGroupSubcategoryCards(serviceGroup) : [];
  const targetCategories = serviceGroup
    ? serviceGroup.subcategories
    : category
      ? [category.name]
      : [];
  const matchingProfessionals = await getCategoryProfessionals(
    targetCategories,
    city,
    area,
  );
  const recipientCount = await getBroadcastRecipientCount({
    category: serviceGroup?.name ?? parentGroup?.name ?? category?.name,
    subcategory: category?.name,
    city,
    area,
  });

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
          {serviceGroup ? "Service Group" : "Subcategory"}
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
          {pageName} Professionals
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
          category={serviceGroup?.name ?? parentGroup?.name ?? category?.name}
          subcategory={category?.name}
          city={city}
          area={area}
        />

        <section className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Available professionals
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal">
                {serviceGroup
                  ? `${serviceGroup.name} professionals`
                  : `${category?.name} professionals`}
              </h2>
            </div>
            <Button asChild variant="outline" className="h-11 w-full sm:w-auto">
              <Link
                href={`/professionals?category=${encodeURIComponent(category?.name ?? serviceGroup?.name ?? "")}`}
              >
                View directory
              </Link>
            </Button>
          </div>

          {matchingProfessionals.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {matchingProfessionals.slice(0, 6).map((professional) => (
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

        {serviceGroup ? (
          <Card className="mt-8 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Choose a specific service
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Message the full {serviceGroup.name} group, or choose one professional type for a more targeted requirement.
              </p>
              <CategoryGrid categories={subcategoryCards} city={city} area={area} />
            </CardContent>
          </Card>
        ) : parentGroup ? (
          <Card className="mt-8 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Parent service group
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {category?.name} belongs to {parentGroup.name}. You can also send one broader requirement to every approved professional in this group.
              </p>
              <Button asChild className="mt-4 h-11 w-full sm:w-auto" variant="outline">
                <Link href={`/categories/${categorySlug(parentGroup.name)}`}>
                  View {parentGroup.name}
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
