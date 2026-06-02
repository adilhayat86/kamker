import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, MessageCircle, Phone, Send, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { recentProfessionals } from "@/lib/marketplace-data";

type ProfessionalProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  return recentProfessionals.map((professional) => ({
    id: professional.id,
  }));
}

export async function generateMetadata({ params }: ProfessionalProfilePageProps) {
  const { id } = await params;
  const professional = recentProfessionals.find((item) => item.id === id);

  return {
    title: professional
      ? `${professional.name} | Kamker Professional Profile`
      : "Professional Profile | Kamker",
  };
}

export default async function ProfessionalProfilePage({
  params,
}: ProfessionalProfilePageProps) {
  const { id } = await params;
  const professional = recentProfessionals.find((item) => item.id === id);

  if (!professional) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <Link href="/professionals" className="text-sm font-medium text-primary">
          Back to professionals
        </Link>
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 sm:flex-row">
              <Image
                src={professional.image}
                alt={`${professional.name} profile photo`}
                width={128}
                height={128}
                priority
                className="size-28 rounded-full bg-accent object-cover"
              />
              <div className="flex-1">
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  Verified badge placeholder
                </Badge>
                <Badge variant="outline" className="ml-2">
                  CNIC Verification Badge
                </Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-normal">
                  {professional.name}
                </h1>
                <p className="mt-1 text-lg font-semibold text-primary">
                  {professional.role}
                </p>
                <p className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" aria-hidden="true" />
                  {professional.city}, {professional.area}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Experience</p>
                <p className="mt-1 font-semibold">{professional.experience}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Rate</p>
                <p className="mt-1 font-semibold">{professional.rate}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="mt-1 flex items-center gap-1 font-semibold">
                  <Star className="size-4 fill-[#f6c343] text-[#f6c343]" aria-hidden="true" />
                  {professional.rating} ({professional.ratingCount})
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Response time</p>
                <p className="mt-1 font-semibold">{professional.responseTime}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground">Bio</p>
              <p className="mt-2 leading-7">{professional.bio}</p>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Button variant="outline" className="h-12">
                <Phone aria-hidden="true" />
                Call
              </Button>
              <Button className="h-12 bg-[#25d366] text-white hover:bg-[#21bd5b]">
                <MessageCircle aria-hidden="true" />
                WhatsApp
              </Button>
              <Button asChild className="h-12">
                <Link href="/send-requirement">
                  <Send aria-hidden="true" />
                  Send Requirement
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
