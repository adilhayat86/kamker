import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Phone, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Professional } from "@/lib/marketplace-data";

type ProfessionalCardProps = {
  professional: Professional;
  featured?: boolean;
};

export function ProfessionalCard({
  professional,
  featured = false,
}: ProfessionalCardProps) {
  return (
    <Card
      className={
        featured
          ? "border-primary/30 bg-white shadow-md"
          : "bg-white shadow-sm"
      }
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-5">
          <Image
            src={professional.image}
            alt={`${professional.name} profile photo`}
            width={96}
            height={96}
            loading="lazy"
            className="size-20 shrink-0 rounded-full bg-accent object-cover sm:size-24"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold leading-tight">
                  {professional.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary">
                  {professional.role}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {featured ? (
                  <Badge className="gap-1 bg-[#f6c343] text-[#241a04] hover:bg-[#f6c343]">
                    <Sparkles className="size-3" aria-hidden="true" />
                    Featured
                  </Badge>
                ) : null}
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  Verified
                </Badge>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {professional.experience}
            </p>
            <Badge variant="outline" className="mt-2 bg-white">
              CNIC Verification Badge
            </Badge>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {professional.city}, {professional.area}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                {professional.rating} ({professional.ratingCount})
              </span>
              <span className="font-medium text-primary">
                {professional.responseTime}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11">
            <Phone aria-hidden="true" />
            Call
          </Button>
          <Button className="h-11 bg-[#25d366] text-white hover:bg-[#21bd5b]">
            <MessageCircle aria-hidden="true" />
            WhatsApp
          </Button>
        </div>
        <Button asChild className="mt-2 h-11 w-full" variant="outline">
          <Link href={`/professionals/${professional.id}`}>View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
