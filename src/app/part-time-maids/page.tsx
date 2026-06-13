import type { Metadata } from "next";

import { SeoLandingPageView } from "@/components/seo-landing-page";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";

const page = getSeoLandingPage("part-time-maids");

export const metadata: Metadata = {
  title: "Find Part Time Maids in Pakistan",
  description:
    "Find part time maids and domestic help in Pakistan by city. Search profiles and contact workers directly where available.",
  alternates: {
    canonical: "/part-time-maids",
  },
};

export default function PartTimeMaidsPage() {
  if (!page) {
    return null;
  }

  return <SeoLandingPageView page={page} />;
}
