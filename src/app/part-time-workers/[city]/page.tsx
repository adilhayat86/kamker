import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoLandingPageView } from "@/components/seo-landing-page";
import { categorySlug, cities } from "@/lib/marketplace-data";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";

type PartTimeWorkersCityPageProps = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return cities.map((city) => ({
    city: categorySlug(city),
  }));
}

export async function generateMetadata({
  params,
}: PartTimeWorkersCityPageProps): Promise<Metadata> {
  const { city } = await params;
  const page = getSeoLandingPage(`part-time-workers/${city}`);

  if (!page) {
    return {
      title: "Part Time Workers",
    };
  }

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${page.slug}`,
    },
  };
}

export default async function PartTimeWorkersCityPage({
  params,
}: PartTimeWorkersCityPageProps) {
  const { city } = await params;
  const page = getSeoLandingPage(`part-time-workers/${city}`);

  if (!page) {
    notFound();
  }

  return <SeoLandingPageView page={page} />;
}
