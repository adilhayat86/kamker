import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
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
  experience: string | null;
  expected_rate: string | null;
  short_bio: string | null;
  profile_photo_url: string | null;
  is_cnic_verified: boolean;
  is_phone_verified: boolean;
  is_featured: boolean;
  featured_until: string | null;
  rating: number | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type ProfessionalsPageProps = {
  searchParams?: Promise<{
    q?: string;
    city?: string;
    category?: string;
  }>;
};

function matches(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query.toLowerCase()) ?? false;
}

function isDbFeatured(professional: DbProfessional) {
  return (
    professional.is_featured &&
    Boolean(professional.featured_until) &&
    new Date(professional.featured_until as string) > new Date()
  );
}

async function getDbProfessionals() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as DbProfessional[];
  }

  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, experience, expected_rate, short_bio, profile_photo_url, is_cnic_verified, is_phone_verified, is_featured, featured_until, rating, cities(name), categories(name)",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

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
            <Badge variant="outline" className="mt-2">
              {professional.is_cnic_verified ? "CNIC Verified" : "Profile Reviewed"}
            </Badge>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {professional.cities?.name ?? "Pakistan"}
                {professional.area ? `, ${professional.area}` : ""}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                {professional.rating ?? 0} (new)
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

export default async function ProfessionalsPage({
  searchParams,
}: ProfessionalsPageProps) {
  const params = await searchParams;
  const q = params?.q?.trim() ?? "";
  const city = params?.city?.trim() ?? "";
  const category = params?.category?.trim() ?? "";

  const dbProfessionals = await getDbProfessionals();
  const filteredDbProfessionals = dbProfessionals.filter((professional) => {
    const keywordMatch = q
      ? matches(professional.full_name, q) ||
        matches(professional.area, q) ||
        matches(professional.experience, q) ||
        matches(professional.short_bio, q) ||
        matches(professional.categories?.name, q) ||
        matches(professional.cities?.name, q)
      : true;
    const cityMatch = city ? professional.cities?.name === city : true;
    const categoryMatch = category ? professional.categories?.name === category : true;

    return keywordMatch && cityMatch && categoryMatch;
  });
  const hasDbProfessionals = dbProfessionals.length > 0;
  const featuredDbProfessionals = filteredDbProfessionals.filter(isDbFeatured);
  const regularDbProfessionals = filteredDbProfessionals.filter(
    (professional) => !isDbFeatured(professional),
  );
  const featuredDemoProfessionals = getActiveFeaturedProfessionals();
  const regularDemoProfessionals = recentProfessionals.filter(
    (professional) => !isActiveFeaturedProfessional(professional),
  );
  const activeProfessionals = hasDbProfessionals
    ? filteredDbProfessionals
    : recentProfessionals;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <PageNavigation backHref="/categories" backLabel="Categories" />
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Professionals
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse approved local professionals and contact them directly without a middleman.
        </p>
        {!hasDbProfessionals ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Demo listings are shown until approved professionals are added in Supabase.
          </p>
        ) : null}

        <form className="mt-6 grid gap-3 rounded-lg bg-white p-3 shadow-sm lg:grid-cols-[1.2fr_1fr_1fr_auto]">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Search</span>
            <Input name="q" placeholder="Nurse, driver, area, name" defaultValue={q} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">City Filter</span>
            <select
              name="city"
              defaultValue={city}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All cities</option>
              {cities.map((cityOption) => (
                <option key={cityOption} value={cityOption}>
                  {cityOption}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Category Filter</span>
            <select
              name="category"
              defaultValue={category}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((categoryOption) => (
                <option key={categoryOption.name} value={categoryOption.name}>
                  {categoryOption.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button className="h-11 w-full lg:w-auto" type="submit">
              <Search aria-hidden="true" />
              Search
            </Button>
            <Button asChild className="h-11 w-full lg:w-auto" variant="outline">
              <Link href="/professionals">Reset</Link>
            </Button>
          </div>
        </form>

        {hasDbProfessionals ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Showing {activeProfessionals.length} approved professional
            {activeProfessionals.length === 1 ? "" : "s"}.
          </p>
        ) : null}

        {hasDbProfessionals && activeProfessionals.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed bg-white p-6 text-sm text-muted-foreground">
            No approved professionals match your search. Try another city,
            category, or keyword.
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
                  <DbProfessionalCard
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
                  <DbProfessionalCard
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
      </section>
    </main>
  );
}
