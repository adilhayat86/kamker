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
};

export function BroadcastRequirementCta({
  count,
  category,
  subcategory,
  city,
  area,
}: BroadcastRequirementCtaProps) {
  const href = buildSendRequirementHref({
    category,
    subcategory,
    city,
    area,
  });
  const buttonText = broadcastButtonText({
    count,
    category,
    subcategory,
    city,
    area,
  });

  return (
    <Card className="mt-5 border-primary/20 bg-primary text-primary-foreground shadow-lg">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-normal text-white/75">
              Broadcast requirement
            </p>
            <p className="mt-1 text-lg font-bold leading-snug sm:text-xl">
              Message matching professionals quickly.
            </p>
          </div>
          <Button
            asChild
            className="h-12 w-full bg-white px-3 text-primary hover:bg-white/90 sm:w-auto sm:min-w-72"
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
