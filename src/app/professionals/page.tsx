import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Phone, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { categories, cities, recentProfessionals } from "@/lib/marketplace-data";

export const metadata = {
  title: "Professionals | Kamker",
  description: "Browse verified Kamker professional profiles.",
};

type DbProfessional = {
  id: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string | null;
  area: string | null;
  experience: string | null;
  expected_rate: string | null;
  short_bio: string | null;
  profile_photo_url: string | null;
  is_cnic_verified: boolean;
  is_phone_verified: boolean;
  rating: number | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

async function getDbProfessionals() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as DbProfessional[];
  }

  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, experience, expected_rate, short_bio, profile_photo_url, is_cnic_verified, is_phone_verified, rating, cities(name), categories(name)",
    )
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Failed to load professionals", error);
    return [] as DbProfessional[];
  }

  return (data ?? []) as DbProfessional[];
}

export default async function ProfessionalsPage() {
  const dbProfessionals = await getDbProfessionals();
  const hasDbProfessionals = dbProfessionals.length > 0;

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
          Browse local professionals and contact them directly without a middleman.
        </p>
        {!hasDbProfessionals ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Demo listings are shown until real professionals are added in Supabase.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 rounded-lg bg-white p-3 shadow-sm sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">City Filter</span>
            <select className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option>All cities</option>
              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Category Filter</span>
            <select className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option>All categories</option>
              {categories.map((category) => (
                <option key={category.name}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasDbProfessionals
            ? dbProfessionals.map((professional) => {
                const whatsappNumber = professional.whatsapp_number ?? professional.phone_number;

                return (
                  <Card key={professional.id} className="bg-white shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <Image
                          src={professional.profile_photo_url || "/kamker-professionals.png"}
                          alt={`${professional.full_name} profile photo`}
                          width={88}
                          height={88}
                          loading="lazy"
                          className="size-20 rounded-full bg-accent object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h2 className="font-semibold">{professional.full_name}</h2>
                              <p className="text-sm font-medium text-primary">
                                {professional.categories?.name ?? "Professional"}
                              </p>
                            </div>
                            <Badge className="gap-1 bg-primary text-primary-foreground">
                              <BadgeCheck className="size-3" aria-hidden="true" />
                              {professional.is_phone_verified ? "Verified" : "New"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {professional.experience ?? professional.short_bio ?? "Experience will be updated soon."}
                          </p>
                          <Badge variant="outline" className="mt-2">
                            {professional.is_cnic_verified ? "CNIC Verified" : "CNIC Pending"}
                          </Badge>
                          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-4" aria-hidden="true" />
                              {professional.cities?.name ?? "Pakistan"}{professional.area ? `, ${professional.area}` : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                              {professional.rating ?? 0} (new)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="h-11">
                          <a href={`tel:${professional.phone_number}`}>
                            <Phone aria-hidden="true" />
                            Call
                          </a>
                        </Button>
                        <Button asChild className="h-11 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                          <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}>
                            <MessageCircle aria-hidden="true" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
                      <Button asChild className="mt-2 h-11 w-full" variant="outline">
                        <Link href={`/professionals/${professional.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            : recentProfessionals.map((professional) => (
                <Card key={professional.id} className="bg-white shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Image
                        src={professional.image}
                        alt={`${professional.name} profile photo`}
                        width={88}
                        height={88}
                        loading="lazy"
                        className="size-20 rounded-full bg-accent object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h2 className="font-semibold">{professional.name}</h2>
                            <p className="text-sm font-medium text-primary">
                              {professional.role}
                            </p>
                          </div>
                          <Badge className="gap-1 bg-primary text-primary-foreground">
                            <BadgeCheck className="size-3" aria-hidden="true" />
                            Verified
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {professional.experience}
                        </p>
                        <Badge variant="outline" className="mt-2">
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
