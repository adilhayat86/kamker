import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

import { KamkerLogo } from "@/components/kamker-logo";
import { Button } from "@/components/ui/button";

type PageNavigationProps = {
  backHref?: string;
  backLabel?: string;
  homeHref?: string;
};

export function PageNavigation({
  backHref,
  backLabel = "Back",
  homeHref = "/",
}: PageNavigationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pr-14">
      <KamkerLogo href={homeHref} />
      <div className="flex items-center gap-2">
        {backHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={backHref}>
              <ArrowLeft aria-hidden="true" />
              {backLabel}
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="sm">
          <Link href={homeHref}>
            <Home aria-hidden="true" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
