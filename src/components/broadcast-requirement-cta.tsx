import Link from "next/link";
import { Send } from "lucide-react";

import {
  broadcastButtonText,
  buildSendRequirementHref,
} from "@/lib/broadcast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type BroadcastRequirementCtaProps = {
  count: number;
  category?: string;
  subcategory?: string;
  city?: string;
  area?: string;
  scope?: "category" | "serviceGroup";
};

export function BroadcastRequirementCta({
  count,
  category,
  subcategory,
  city,
  area,
  scope,
}: BroadcastRequirementCtaProps) {
  const href = buildSendRequirementHref({
    category,
    subcategory,
    city,
    area,
    scope,
  });
  const buttonText = broadcastButtonText({
    count,
    category,
    subcategory,
    city,
    area,
    scope,
  });

  return (
    <Card className="mt-5 border-primary/20 bg-primary text-primary-foreground shadow-lg">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-white/80">
              Send Requirement
            </p>
            <p className="mt-1 text-lg font-bold leading-snug sm:text-xl">
              Reach matching professionals quickly.
            </p>
          </div>
          <Button
            asChild
            className="h-12 w-full bg-white px-3 font-semibold text-primary hover:bg-white/90 sm:w-auto sm:min-w-72"
          >
            <Link href={href}>
              <Send aria-hidden="true" />
              <span className="min-w-0 truncate">{buttonText}</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
