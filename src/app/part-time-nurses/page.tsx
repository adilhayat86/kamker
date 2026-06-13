import type { Metadata } from "next";

import { SeoLandingPageView } from "@/components/seo-landing-page";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";

const page = getSeoLandingPage("part-time-nurses");

export const metadata: Metadata = {
  title: "Find Part Time Nurses in Pakistan",
  description:
    "Find part time nurses and healthcare workers in Pakistan by city. Search profiles for home care, caregiving, and related support.",
  alternates: {
    canonical: "/part-time-nurses",
  },
};

export default function PartTimeNursesPage() {
  if (!page) {
    return null;
  }

  return <SeoLandingPageView page={page} />;
}
