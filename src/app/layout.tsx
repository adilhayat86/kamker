import type { Metadata, Viewport } from "next";

import { GlobalMenu } from "@/components/global-menu";

import "./globals.css";

export const metadata: Metadata = {
  title: "Kamker | Find trusted workers in Pakistan",
  description:
    "A Pakistan service-directory marketplace for nurses, teachers, drivers, cooks, electricians, beauticians, guards, and more.",
  openGraph: {
    title: "Kamker | Find trusted workers in Pakistan",
    description:
      "Find verified local workers and professionals across Pakistan.",
    siteName: "Kamker",
    type: "website",
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
