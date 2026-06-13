import type { Metadata } from "next";

import { SeoLandingPageView } from "@/components/seo-landing-page";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";

const page = getSeoLandingPage("part-time-workers");

export const metadata: Metadata = {
  title: "Find Part Time Workers in Pakistan",
  description:
    "Find part time workers in Pakistan by category and city, including maids, nurses, drivers, tutors, cooks, guards, and home service professionals.",
  alternates: {
    canonical: "/part-time-workers",
  },
};

export default function PartTimeWorkersPage() {
  if (!page) {
    return null;
  }

  return <SeoLandingPageView page={page} />;
}
