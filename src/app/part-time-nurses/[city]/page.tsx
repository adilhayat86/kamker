import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoLandingPageView } from "@/components/seo-landing-page";
import { seoLandingPages, getSeoLandingPage } from "@/lib/seo-landing-pages";

type SeoCityPageProps = {
  params: Promise<{ city: string }>;
};

const baseSlug = "part-time-nurses";

export function generateStaticParams() {
  return seoLandingPages
    .filter((page) => page.slug.startsWith(`${baseSlug}/`))
    .map((page) => ({ city: page.slug.split("/")[1] }));
}

export async function generateMetadata({
  params,
}: SeoCityPageProps): Promise<Metadata> {
  const { city } = await params;
  const page = getSeoLandingPage(`${baseSlug}/${city}`);

  if (!page) {
    return { title: "Part Time Nurses" };
  }

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
  };
}

export default async function PartTimeNursesCityPage({
  params,
}: SeoCityPageProps) {
  const { city } = await params;
  const page = getSeoLandingPage(`${baseSlug}/${city}`);

  if (!page) {
    notFound();
  }

  return <SeoLandingPageView page={page} />;
}
