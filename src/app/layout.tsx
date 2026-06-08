import type { Metadata, Viewport } from "next";

import { GlobalMenu } from "@/components/global-menu";

import "./globals.css";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kamker.com");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Kamker - Find Part Time Workers in Pakistan",
    template: "%s | Kamker",
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Kamker - Find Part Time Workers in Pakistan",
    description:
      "Find part time workers by category and city across Pakistan.",
  },
  alternates: {
    canonical: "/",
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
        <GlobalMenu />
        {children}
      </body>
    </html>
  );
}
