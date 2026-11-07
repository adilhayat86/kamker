"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { updateAdDisplay } from "@/lib/ad-display";

export function AdDisplay() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();

  useEffect(() => { updateAdDisplay(); }, [pathname, query]);
  return null;
}
