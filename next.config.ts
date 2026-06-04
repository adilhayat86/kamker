import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const sharedConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/professional-photos/**",
          },
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/proof-images/**",
          },
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/company-images/**",
          },
        ]
      : [],
  },
};

export default function nextConfig(phase: string): NextConfig {
  return {
    ...sharedConfig,
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
