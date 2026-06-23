import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { AnalyticsPageView } from "@/components/analytics-page-view";
import { GlobalMenu } from "@/components/global-menu";
import { RegistrationClickTracker } from "@/components/registration-analytics";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kamker.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Kamker",
  title: {
    default: "Kamker - Find Part Time Workers in Pakistan",
    template: "%s",
  },
  description:
    "Find nurses, maids, drivers, tutors, cooks, guards, and other part time workers by city in Pakistan. Contact workers directly or send your requirement.",
  keywords: [
    "part time workers",
    "part time worker",
    "part time work Pakistan",
    "find workers Pakistan",
    "maids Pakistan",
    "nurses Pakistan",
    "drivers Pakistan",
    "tutors Pakistan",
  ],
  openGraph: {
    title: "Kamker - Find Part Time Workers in Pakistan",
    description:
      "Find nurses, maids, drivers, tutors, cooks, guards, and other part time workers by city in Pakistan.",
    url: "/",
    siteName: "Kamker",
    type: "website",
    images: [
      {
        url: "/kamker-professionals.png",
        width: 1200,
        height: 630,
        alt: "Kamker workers marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kamker - Find Part Time Workers in Pakistan",
    description:
      "Find part time workers by category and city across Pakistan.",
    images: ["/kamker-professionals.png"],
  },
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Kamker",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1896d3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Suspense fallback={null}>
          <AnalyticsPageView />
          <RegistrationClickTracker />
        </Suspense>
        <ServiceWorkerRegistration />
        <GlobalMenu />
        {children}
      </body>
    </html>
  );
}
