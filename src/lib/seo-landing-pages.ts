import { categories, categorySlug, cities } from "@/lib/marketplace-data";

export type SeoLandingPage = {
  slug: string;
  title: string;
  heading: string;
  description: string;
  intro: string;
  faqs?: SeoLandingFaq[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  focusCategory?: string;
  focusCity?: string;
  relatedCategories: string[];
};

export type SeoLandingFaq = {
  question: string;
  answer: string;
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

const defaultFaqs: SeoLandingFaq[] = [
  {
    question: "Is Kamker a job board?",
    answer:
      "No. Kamker is a worker directory and requirement marketplace where customers browse worker profiles by category and city.",
  },
  {
    question: "Can workers register free?",
    answer:
      "Yes. Workers can register free on Kamker. Kamker does not charge commission from workers.",
  },
  {
    question: "How do I find part time workers by city?",
    answer:
      "Use the search and city filters, or open a city landing page and browse matching worker categories.",
  },
  {
    question: "Can I contact workers directly?",
    answer:
      "Yes, where a worker has shared phone or WhatsApp contact details, customers can contact directly.",
  },
  {
    question: "Is Send Requirement paid?",
    answer:
      "Send Requirement is a paid outreach option after Kamker reviews the request details.",
  },
];

const categorySeoConfig = [
  {
    baseSlug: "part-time-maids",
    category: "Maids",
    plural: "maids",
    relatedCategories: ["Maids", "Housekeepers", "Cleaners", "Cooks", "Babysitters"],
    intro:
      "Kamker keeps maid and domestic help search simple: choose a city, review worker profiles, and use direct contact where available.",
    description:
      "Find part time maids and domestic help in Pakistan by city. Search profiles and contact workers directly where available.",
  },
  {
    baseSlug: "part-time-nurses",
    category: "Nurses",
    plural: "nurses",
    relatedCategories: ["Nurses", "Caregivers", "Physiotherapists", "Lab Technicians"],
    intro:
      "Kamker helps families search nurses and healthcare support by city, area, and profile details before making direct contact.",
    description:
      "Find part time nurses and healthcare workers in Pakistan by city. Search profiles for home care, caregiving, and related support.",
  },
  {
    baseSlug: "part-time-drivers",
    category: "Drivers",
    plural: "drivers",
    relatedCategories: ["Drivers", "Delivery Riders", "Truck Drivers", "Bus Drivers"],
    intro:
      "Search driver profiles by city and compare availability, experience, and direct contact options where available.",
    description:
      "Find part time drivers, delivery riders, and transport workers in Pakistan by city through Kamker.",
  },
  {
    baseSlug: "part-time-tutors",
    category: "Home Tutors",
    plural: "tutors",
    relatedCategories: ["Home Tutors", "Online Tutors", "School Teachers", "Quran Teachers"],
    intro:
      "Kamker connects students and families with tutor categories such as home tutors, online tutors, Quran teachers, and school teachers.",
    description:
      "Find part time tutors, home tutors, online tutors, and school teachers in Pakistan by city.",
  },
];

const categoryCityTargets: Record<string, string[]> = {
  "part-time-maids": cities,
  "part-time-nurses": cities,
  "part-time-drivers": cities,
  "part-time-tutors": cities,
};

export const partTimeWorkerPages: SeoLandingPage[] = [
  {
    slug: "part-time-workers",
    title: "Find Part Time Workers in Pakistan",
    heading: "Find part time workers in Pakistan",
    description:
      "Find part time workers in Pakistan by category and city, including maids, nurses, drivers, tutors, cooks, guards, and home service professionals.",
    intro:
      "Kamker helps customers search real worker categories and city filters without becoming a traditional part time job board. Browse profiles, compare details, and contact workers directly where phone or WhatsApp is available.",
    faqs: defaultFaqs,
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
    faqs: defaultFaqs,
    primaryHref: workerSearchHref(city),
    primaryLabel: `Browse workers in ${city}`,
    secondaryHref: requirementHref(undefined, city),
    secondaryLabel: "Send requirement",
    focusCity: city,
    relatedCategories: commonCategories,
  })),
];

export const partTimeCategoryPages: SeoLandingPage[] = [
  ...categorySeoConfig.map((config) => ({
    slug: config.baseSlug,
    title: `Find Part Time ${config.plural.replace(/^\w/, (letter) => letter.toUpperCase())} in Pakistan`,
    heading: `Find part time ${config.plural} in Pakistan`,
    description: config.description,
    intro: config.intro,
    faqs: defaultFaqs,
    primaryHref: categorySearchHref(config.category),
    primaryLabel: `Browse ${config.plural}`,
    secondaryHref: requirementHref(config.category),
    secondaryLabel: "Send requirement",
    focusCategory: config.category,
    relatedCategories: config.relatedCategories,
  })),
];

export const partTimeCategoryCityPages: SeoLandingPage[] = categorySeoConfig.flatMap(
  (config) =>
    (categoryCityTargets[config.baseSlug] ?? []).map((city) => ({
      slug: `${config.baseSlug}/${categorySlug(city)}`,
      title: `Find Part Time ${config.plural.replace(/^\w/, (letter) => letter.toUpperCase())} in ${city}`,
      heading: `Find part time ${config.plural} in ${city}`,
      description: `Find part time ${config.plural} in ${city}. Search Kamker worker profiles by category and city, then contact directly where available.`,
      intro: `Use Kamker to find ${config.plural} in ${city}. Browse profiles, compare worker details, and use direct contact or reviewed requirement outreach when needed.`,
      faqs: defaultFaqs,
      primaryHref: categorySearchHref(config.category, city),
      primaryLabel: `Browse ${config.plural} in ${city}`,
      secondaryHref: requirementHref(config.category, city),
      secondaryLabel: "Send requirement",
      focusCategory: config.category,
      focusCity: city,
      relatedCategories: config.relatedCategories,
    })),
);

export const seoLandingPages = [
  ...partTimeWorkerPages,
  ...partTimeCategoryPages,
  ...partTimeCategoryCityPages,
];

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
