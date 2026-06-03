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

  return (
    <Card className="mt-6 border-primary/20 bg-primary text-primary-foreground shadow-lg">
      <CardContent className="p-4 sm:p-5">
        <p className="text-sm font-semibold text-white/80">
          Broadcast requirement
        </p>
        <p className="mt-1 text-lg font-bold sm:text-xl">
          Message matching professionals quickly.
        </p>
        <Button asChild className="mt-4 h-12 w-full bg-white text-primary hover:bg-white/90">
          <Link href={href}>
            <Send aria-hidden="true" />
            {broadcastButtonText({
              count,
              category,
              subcategory,
              city,
              area,
            })}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
