import type { Metadata } from "next";

import { SeoLandingPageView } from "@/components/seo-landing-page";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";

const page = getSeoLandingPage("part-time-tutors");

export const metadata: Metadata = {
  title: "Find Part Time Tutors in Pakistan",
  description:
    "Find part time tutors, home tutors, online tutors, and school teachers in Pakistan by city.",
  alternates: {
    canonical: "/part-time-tutors",
  },
};

export default function PartTimeTutorsPage() {
  if (!page) {
    return null;
  }

  return <SeoLandingPageView page={page} />;
}
