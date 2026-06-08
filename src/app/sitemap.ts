import type { MetadataRoute } from "next";

import {
  categories,
  categorySlug,
  parentCategories,
  recentProfessionals,
} from "@/lib/marketplace-data";
import { seoLandingPages } from "@/lib/seo-landing-pages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kamker.com";

function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
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
  const professionalRoutes = recentProfessionals.map(
    (professional) => `/professionals/${professional.id}`,
  );
  const seoRoutes = seoLandingPages.map((page) => `/${page.slug}`);

  return [...staticRoutes, ...categoryRoutes, ...professionalRoutes, ...seoRoutes].map(
    (route) => ({
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
              : 0.5,
    }),
  );
}
