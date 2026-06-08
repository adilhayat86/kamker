import type { Metadata } from "next";

import { SeoLandingPageView } from "@/components/seo-landing-page";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";

const page = getSeoLandingPage("part-time-drivers");

export const metadata: Metadata = {
  title: "Find Part Time Drivers in Pakistan",
  description:
    "Find part time drivers, delivery riders, and transport workers in Pakistan by city through Kamker.",
  alternates: {
    canonical: "/part-time-drivers",
  },
};

export default function PartTimeDriversPage() {
  if (!page) {
    return null;
  }

  return <SeoLandingPageView page={page} />;
}
