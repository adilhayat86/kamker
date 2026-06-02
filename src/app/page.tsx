import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Car,
  ChefHat,
  GraduationCap,
  HeartPulse,
  Home,
  MapPin,
  Paintbrush,
  PlugZap,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";

import { AdSlot } from "@/components/ad-slot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase";

const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"];

const categories = [
  { name: "Nurses", icon: HeartPulse, count: "1.2k" },
  { name: "Maids", icon: Home, count: "2.8k" },
  { name: "Teachers", icon: GraduationCap, count: "1.9k" },
  { name: "Handwriting", icon: Paintbrush, count: "420" },
  { name: "Drivers", icon: Car, count: "1.5k" },
  { name: "Cooks", icon: ChefHat, count: "980" },
  { name: "Electricians", icon: PlugZap, count: "760" },
  { name: "Plumbers", icon: Wrench, count: "690" },
  { name: "Beauticians", icon: Scissors, count: "840" },
  { name: "Guards", icon: ShieldCheck, count: "610" },
];

const workers = [
  {
    name: "Ayesha N.",
    role: "Home Nurse",
    city: "Lahore",
    rating: "4.9",
    rate: "From Rs. 2,500/day",
    tags: ["Elder care", "Verified CNIC"],
  },
  {
    name: "Rashid K.",
    role: "Electrician",
    city: "Karachi",
    rating: "4.8",
    rate: "From Rs. 1,200/visit",
    tags: ["Same day", "Wiring"],
  },
  {
    name: "Sana T.",
    role: "Tutor",
    city: "Islamabad",
    rating: "5.0",
    rate: "From Rs. 12,000/month",
    tags: ["Maths", "O/A Level"],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2" aria-label="Kamker home">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              K
            </span>
            <span className="text-xl font-bold tracking-normal">Kamker</span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#categories" className="hover:text-foreground">
              Categories
            </a>
            <a href="#professionals" className="hover:text-foreground">
              Professionals
            </a>
            <a href="#join" className="hover:text-foreground">
              Join as worker
            </a>
          </div>
          <Button size="sm">Post a job</Button>
        </nav>
      </header>

      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/kamker-professionals.png"
            alt="Pakistani service professionals ready for work"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,251,247,0.98)_0%,rgba(251,251,247,0.88)_38%,rgba(251,251,247,0.2)_100%)]" />
        </div>
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl content-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 gap-1.5">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Pakistan service marketplace
            </Badge>
            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Hire trusted local workers without the guesswork.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Find nurses, maids, teachers, drivers, cooks, electricians,
              plumbers, beauticians, guards, artists, and tutors across Pakistan.
            </p>

            <Card className="mt-7 max-w-xl border-0 bg-white/95 shadow-xl">
              <CardContent className="p-3">
                <form className="grid gap-3 sm:grid-cols-[1fr_0.75fr_auto]">
                  <label className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Service</span>
                    <Input
                      placeholder="Nurse, maid, tutor..."
                      className="pl-9"
                      name="service"
                    />
                  </label>
                  <label className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="sr-only">City</span>
                    <Input placeholder="City" className="pl-9" name="city" />
                  </label>
                  <Button type="submit" className="h-11">
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-4 flex flex-wrap gap-2">
              {cities.map((city) => (
                <Badge key={city} variant="outline" className="bg-white/80">
                  {city}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AdSlot label="Top ad banner 970 x 90" />
      </section>

      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Browse by need
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">
              Popular service categories
            </h2>
          </div>
          <Button variant="outline">
            View all
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Card key={category.name} className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.count} listed
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y bg-secondary/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["CNIC-aware profiles", "Capture identity status and service history."],
              ["Local availability", "Filter by city, area, gender, and timings."],
              ["Direct booking path", "Move from search to quote request quickly."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-lg bg-background p-5">
                <BadgeCheck className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
          <AdSlot label="Sidebar ad slot 300 x 250" className="min-h-64 bg-white" />
        </div>
      </section>

      <section
        id="professionals"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Featured today
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">
              Professionals ready nearby
            </h2>
          </div>
          <Badge variant={isSupabaseConfigured ? "default" : "secondary"}>
            Supabase {isSupabaseConfigured ? "connected" : "ready"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker.name} className="bg-white">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{worker.name}</CardTitle>
                    <CardDescription>{worker.role}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1 rounded-md bg-[#fff4d6] px-2 py-1 text-sm font-semibold text-[#7a4c00]">
                    <Star className="size-4 fill-current" aria-hidden="true" />
                    {worker.rating}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden="true" />
                  {worker.city}
                </div>
                <p className="mt-3 text-lg font-semibold">{worker.rate}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {worker.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button className="mt-5 w-full" variant="outline">
                  View profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="join" className="bg-[#14372f] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
          <div>
            <Badge className="bg-white text-[#14372f]">For workers</Badge>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-normal sm:text-4xl">
              Build a professional profile people can trust.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/75">
              List your skills, preferred areas, rates, timing, work photos, and
              verification status. Kamker is prepared for Supabase-backed worker
              profiles, bookings, and reviews.
            </p>
          </div>
          <Card className="border-white/15 bg-white/10 text-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-md bg-white text-[#14372f]">
                  <BriefcaseBusiness className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold">Start as a Kamker pro</h3>
                  <p className="text-sm text-white/70">
                    Nurses, tutors, cooks, drivers, artists, and tradespeople.
                  </p>
                </div>
              </div>
              <Button className="mt-5 w-full bg-white text-[#14372f] hover:bg-white/90">
                Create worker profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Kamker Pakistan service directory marketplace.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground">
            Terms
          </a>
          <a href="#" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </footer>
    </main>
  );
}
