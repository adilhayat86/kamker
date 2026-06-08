import { categories, categorySlug, cities } from "@/lib/marketplace-data";

export type SeoLandingPage = {
  slug: string;
  title: string;
  heading: string;
  description: string;
  intro: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  focusCategory?: string;
  focusCity?: string;
  relatedCategories: string[];
};

const citySet = new Set(cities);

function categorySearchHref(category: string, city?: string) {
  const params = new URLSearchParams({ category });

  if (city) {
    params.set("city", city);
  }

  return `/professionals?${params.toString()}`;
}

function workerSearchHref(city?: string) {
  const params = new URLSearchParams();

  if (city) {
    params.set("city", city);
  }

  const query = params.toString();
  return query ? `/professionals?${query}` : "/professionals";
}

function requirementHref(category?: string, city?: string) {
  const params = new URLSearchParams();

  if (category) {
    params.set("category", category);
  }

  if (city) {
    params.set("city", city);
  }

  params.set("source", "seo-landing");
  return `/send-requirement?${params.toString()}`;
}

const commonCategories = [
  "Nurses",
  "Maids",
  "Drivers",
  "Home Tutors",
  "Cooks",
  "Security Guards",
  "Beauticians",
  "Electricians",
];

export const partTimeWorkerPages: SeoLandingPage[] = [
  {
    slug: "part-time-workers",
    title: "Find Part Time Workers in Pakistan",
    heading: "Find part time workers in Pakistan",
    description:
      "Find part time workers in Pakistan by category and city, including maids, nurses, drivers, tutors, cooks, guards, and home service professionals.",
    intro:
      "Kamker helps customers search real worker categories and city filters without becoming a traditional part time job board. Browse profiles, compare details, and contact workers directly where phone or WhatsApp is available.",
    primaryHref: "/professionals",
    primaryLabel: "Browse workers",
    secondaryHref: "/register",
    secondaryLabel: "Register as worker",
    relatedCategories: commonCategories,
  },
  ...cities.map((city) => ({
    slug: `part-time-workers/${categorySlug(city)}`,
    title: `Find Part Time Workers in ${city}`,
    heading: `Find part time workers in ${city}`,
    description: `Find part time workers in ${city} by category, including maids, nurses, drivers, tutors, cooks, guards, and home service professionals.`,
    intro: `Use Kamker to search workers in ${city} by service category. Choose a profession, compare profiles, and contact directly where call or WhatsApp is available.`,
    primaryHref: workerSearchHref(city),
    primaryLabel: `Browse workers in ${city}`,
    secondaryHref: requirementHref(undefined, city),
    secondaryLabel: "Send requirement",
    focusCity: city,
    relatedCategories: commonCategories,
  })),
];

export const partTimeCategoryPages: SeoLandingPage[] = [
  {
    slug: "part-time-maids",
    title: "Find Part Time Maids in Pakistan",
    heading: "Find part time maids in Pakistan",
    description:
      "Find part time maids and domestic help in Pakistan by city. Search profiles and contact workers directly where available.",
    intro:
      "Kamker keeps maid and domestic help search simple: choose a city, review worker profiles, and use direct contact where available.",
    primaryHref: categorySearchHref("Maids"),
    primaryLabel: "Browse maids",
    secondaryHref: requirementHref("Maids"),
    secondaryLabel: "Send requirement",
    focusCategory: "Maids",
    relatedCategories: ["Maids", "Housekeepers", "Cleaners", "Cooks", "Babysitters"],
  },
  {
    slug: "part-time-nurses",
    title: "Find Part Time Nurses in Pakistan",
    heading: "Find part time nurses in Pakistan",
    description:
      "Find part time nurses and healthcare workers in Pakistan by city. Search profiles for home care, caregiving, and related support.",
    intro:
      "Kamker helps families search nurses and healthcare support by city, area, and profile details before making direct contact.",
    primaryHref: categorySearchHref("Nurses"),
    primaryLabel: "Browse nurses",
    secondaryHref: requirementHref("Nurses"),
    secondaryLabel: "Send requirement",
    focusCategory: "Nurses",
    relatedCategories: ["Nurses", "Caregivers", "Physiotherapists", "Lab Technicians"],
  },
  {
    slug: "part-time-drivers",
    title: "Find Part Time Drivers in Pakistan",
    heading: "Find part time drivers in Pakistan",
    description:
      "Find part time drivers, delivery riders, and transport workers in Pakistan by city through Kamker.",
    intro:
      "Search driver profiles by city and compare availability, experience, and direct contact options where available.",
    primaryHref: categorySearchHref("Drivers"),
    primaryLabel: "Browse drivers",
    secondaryHref: requirementHref("Drivers"),
    secondaryLabel: "Send requirement",
    focusCategory: "Drivers",
    relatedCategories: ["Drivers", "Delivery Riders", "Truck Drivers", "Bus Drivers"],
  },
  {
    slug: "part-time-tutors",
    title: "Find Part Time Tutors in Pakistan",
    heading: "Find part time tutors in Pakistan",
    description:
      "Find part time tutors, home tutors, online tutors, and school teachers in Pakistan by city.",
    intro:
      "Kamker connects students and families with tutor categories such as home tutors, online tutors, Quran teachers, and school teachers.",
    primaryHref: categorySearchHref("Home Tutors"),
    primaryLabel: "Browse tutors",
    secondaryHref: requirementHref("Home Tutors"),
    secondaryLabel: "Send requirement",
    focusCategory: "Home Tutors",
    relatedCategories: ["Home Tutors", "Online Tutors", "School Teachers", "Quran Teachers"],
  },
];

export const seoLandingPages = [...partTimeWorkerPages, ...partTimeCategoryPages];

export function getSeoLandingPage(slug: string) {
  return seoLandingPages.find((page) => page.slug === slug);
}

export function knownSeoCategoryNames(names: string[]) {
  const known = new Set(categories.map((category) => category.name));
  return names.filter((name) => known.has(name));
}

export function isKnownSeoCity(city: string | undefined) {
  return city ? citySet.has(city) : false;
}
