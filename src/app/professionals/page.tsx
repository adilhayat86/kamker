import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Phone, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { recentProfessionals } from "@/lib/marketplace-data";

export const metadata = {
  title: "Professionals | Kamker",
  description: "Browse verified Kamker professional profiles.",
};

export default function ProfessionalsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-primary">
          Kamker
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Professionals
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse mock professional profiles while the directory backend is being prepared.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentProfessionals.map((professional) => (
            <Card key={professional.id} className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Image
                    src={professional.image}
                    alt={`${professional.name} profile photo`}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="size-16 rounded-full bg-accent object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold">{professional.name}</h2>
                        <p className="text-sm font-medium text-primary">
                          {professional.role}
                        </p>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <BadgeCheck className="size-3" aria-hidden="true" />
                        Verified
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {professional.experience}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-4" aria-hidden="true" />
                        {professional.city}, {professional.area}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                        {professional.rating} ({professional.ratingCount})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
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
                  <Link href={`/professionals/${professional.id}`}>
                    View Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
