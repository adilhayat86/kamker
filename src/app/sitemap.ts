import type { MetadataRoute } from "next";

import {
  categories,
  categorySlug,
  parentCategories,
} from "@/lib/marketplace-data";
import { seoLandingPages } from "@/lib/seo-landing-pages";
import { buildProfileSlug } from "@/lib/slug";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kamker.com";
const MAX_DYNAMIC_ENTRIES = 5000;

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

async function getProfessionalRoutes() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as string[];
  }

  const { data, error } = await supabase
    .from("professionals")
    .select("id, full_name")
    .eq("is_active", true)
    .or("is_banned.eq.false,is_banned.is.null")
    .limit(MAX_DYNAMIC_ENTRIES);

  if (error || !data) {
    return [] as string[];
  }

  return data.map((row) => `/professionals/${buildProfileSlug(row.full_name, row.id)}`);
}

async function getCompanyRoutes() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as string[];
  }

  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("verification_status", "verified")
    .limit(MAX_DYNAMIC_ENTRIES);

  if (error || !data) {
    return [] as string[];
  }

  return data.map((row) => `/companies/${row.id}`);
}

async function getCompanyListingRoutes() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as string[];
  }

  const { data, error } = await supabase
    .from("company_listings")
    .select("id, title")
    .eq("status", "approved")
    .limit(MAX_DYNAMIC_ENTRIES);

  if (error || !data) {
    return [] as string[];
  }

  return data.map((row) => `/company-listings/${buildProfileSlug(row.title, row.id)}`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = [
    "/",
    "/about",
    "/categories",
    "/professionals",
    "/register",
    "/register/professional",
    "/register/company",
    "/send-requirement",
    "/contact",
    "/privacy",
    "/terms",
  ];
  const categoryRoutes = [...parentCategories, ...categories].map(
    (category) => `/categories/${categorySlug(category.name)}`,
  );
  const seoRoutes = seoLandingPages.map((page) => `/${page.slug}`);
  const [professionalRoutes, companyRoutes, companyListingRoutes] = await Promise.all([
    getProfessionalRoutes(),
    getCompanyRoutes(),
    getCompanyListingRoutes(),
  ]);

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...seoRoutes,
    ...professionalRoutes,
    ...companyRoutes,
    ...companyListingRoutes,
  ].map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority:
      route === "/"
        ? 1
        : route.startsWith("/part-time")
          ? 0.9
          : route.startsWith("/categories") || route.startsWith("/professionals")
            ? 0.8
            : route.startsWith("/companies") || route.startsWith("/company-listings")
              ? 0.6
              : 0.5,
  }));
}
