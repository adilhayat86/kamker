import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Clock, MapPin, MessageCircle, Phone, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Professional } from "@/lib/marketplace-data";
import { workerAvailabilityLabel } from "@/lib/worker-availability";

type ProfessionalCardProps = {
  professional: Professional;
  featured?: boolean;
};

export function ProfessionalCard({
  professional,
  featured = false,
}: ProfessionalCardProps) {
  const phoneHref = professional.phone ? `tel:${professional.phone}` : null;
  const whatsappHref = professional.whatsapp
    ? `https://wa.me/${professional.whatsapp.replace(/\D/g, "")}`
    : null;
  const profileHref = professional.profileHref ?? `/professionals/${professional.id}`;

  return (
    <Card
      className={
        featured
          ? "flex h-full flex-col border-primary/30 bg-white shadow-md"
          : "flex h-full flex-col bg-white shadow-sm"
      }
    >
      <CardContent className="flex h-full flex-col p-3.5 sm:p-4">
        <div className="flex items-start gap-3.5">
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
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold leading-tight">
                  {professional.name}
                </h3>
                <p className="text-sm font-medium text-primary">
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
                {professional.is_company_managed ? (
                  <Badge variant="outline">Company Managed</Badge>
                ) : null}
                {professional.company_verified ? (
                  <Badge variant="outline">Verified Company</Badge>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold leading-tight text-primary sm:text-3xl">
              {professional.rate}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {professional.tagline}
            </p>
            <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden="true" />
                {professional.city}, {professional.area}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" aria-hidden="true" />
                Available: {workerAvailabilityLabel(professional.availability)}
              </span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                {professional.experience}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">
          <Badge variant="secondary">{professional.gender}</Badge>
          <Badge variant="secondary">{workerAvailabilityLabel(professional.availability)}</Badge>
          {professional.is_company_managed ? (
            <Badge variant="outline">{professional.company_name ?? "Company Managed"}</Badge>
          ) : (
            <>
              <Badge variant="outline">CNIC Verified</Badge>
              <Badge variant="outline">Phone Verified</Badge>
            </>
          )}
        </div>
        <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
          <Button asChild={Boolean(phoneHref)} variant="outline" className="h-10 px-2" disabled={!phoneHref}>
            {phoneHref ? (
              <a href={phoneHref}>
                <Phone aria-hidden="true" />
                Call
              </a>
            ) : (
              <span>
                <Phone aria-hidden="true" />
                Call
              </span>
            )}
          </Button>
          <Button asChild={Boolean(whatsappHref)} className="h-10 bg-[#25d366] px-2 text-white hover:bg-[#21bd5b]" disabled={!whatsappHref}>
            {whatsappHref ? (
              <a href={whatsappHref}>
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </a>
            ) : (
              <span>
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </span>
            )}
          </Button>
          <Button asChild className="h-10 px-2" variant="outline">
            <Link href={profileHref}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
