import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  BriefcaseBusiness,
  Car,
  ChefHat,
  ClipboardList,
  Contact,
  Drill,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Image as ImageIcon,
  Leaf,
  MapPin,
  Paintbrush,
  Palette,
  PencilRuler,
  PlugZap,
  Send,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  User,
  UserCheck,
  Users,
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
  { name: "Nurses", icon: HeartPulse },
  { name: "Maids", icon: Home },
  { name: "Teachers", icon: GraduationCap },
  { name: "Handwriting Teachers", icon: Paintbrush },
  { name: "Tutors", icon: GraduationCap },
  { name: "Home Tutors", icon: Home },
  { name: "Quran Teachers", icon: GraduationCap },
  { name: "Drivers", icon: Car },
  { name: "Cooks", icon: ChefHat },
  { name: "Electricians", icon: PlugZap },
  { name: "Plumbers", icon: Wrench },
  { name: "Beauticians", icon: Scissors },
  { name: "Security Guards", icon: ShieldCheck },
  { name: "Office Boys", icon: BriefcaseBusiness },
  { name: "Peons", icon: UserCheck },
  { name: "Gardeners", icon: Leaf },
  { name: "Carpenters", icon: Hammer },
  { name: "AC Technicians", icon: Drill },
  { name: "Mechanics", icon: Wrench },
  { name: "Painters", icon: Palette },
  { name: "Welders", icon: Drill },
  { name: "Tailors", icon: Scissors },
  { name: "Babysitters", icon: Users },
  { name: "Caregivers", icon: Stethoscope },
  { name: "Physiotherapists", icon: HeartPulse },
  { name: "Lab Technicians", icon: Stethoscope },
  { name: "Artists", icon: Palette },
  { name: "Graphic Designers", icon: PencilRuler },
  { name: "Photographers", icon: ImageIcon },
  { name: "Event Staff", icon: Contact },
  { name: "Delivery Riders", icon: Bike },
];

const trustBadges = [
  { label: "Verified Profiles", icon: BadgeCheck },
  { label: "Direct Contact", icon: Contact },
  { label: "No Middleman", icon: UserCheck },
  { label: "Pakistan Wide", icon: MapPin },
];

const bottomNavItems = [
  { label: "Home", icon: Home, href: "#" },
  { label: "Categories", icon: ClipboardList, href: "#categories" },
  { label: "Requirements", icon: Send, href: "#requirements" },
  { label: "Post Job", icon: BriefcaseBusiness, href: "#join" },
  { label: "Profile", icon: User, href: "#join" },
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
    <main className="min-h-screen overflow-hidden pb-20 md:pb-0">
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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="hidden sm:inline-flex">
              <Send aria-hidden="true" />
              Send Requirement
            </Button>
            <Button size="sm">Post a job</Button>
          </div>
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
        <div className="mx-auto grid min-h-[430px] max-w-7xl content-center px-4 py-5 sm:min-h-[calc(100svh-4rem)] sm:px-6 sm:py-8 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-3 gap-1.5 sm:mb-4">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Pakistan service marketplace
            </Badge>
            <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              Hire trusted local workers without the guesswork.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-7">
              Find nurses, maids, teachers, drivers, cooks, electricians,
              plumbers, beauticians, guards, artists, and tutors across Pakistan.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
              {trustBadges.map((item) => {
                const Icon = item.icon;

                return (
                  <Badge
                    key={item.label}
                    variant="outline"
                    className="justify-center gap-1.5 bg-white/85 px-3 py-1.5 text-xs"
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {item.label}
                  </Badge>
                );
              })}
            </div>

            <Card className="mt-4 max-w-xl border-0 bg-white/95 shadow-xl sm:mt-7">
              <CardContent className="p-2 sm:p-3">
                <form className="grid gap-2 sm:grid-cols-[1fr_0.75fr_auto] sm:gap-3">
                  <label className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground sm:top-3.5"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Service</span>
                    <Input
                      placeholder="Nurse, maid, tutor..."
                      className="h-10 pl-9 sm:h-11"
                      name="service"
                    />
                  </label>
                  <label className="relative">
                    <MapPin
                      className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground sm:top-3.5"
                      aria-hidden="true"
                    />
                    <span className="sr-only">City</span>
                    <Input
                      placeholder="City"
                      className="h-10 pl-9 sm:h-11"
                      name="city"
                    />
                  </label>
                  <Button type="submit" className="h-10 sm:h-11">
                    Search
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {cities.map((city) => (
                <Badge
                  key={city}
                  variant="outline"
                  className="shrink-0 bg-white/80"
                >
                  {city}
                </Badge>
              ))}
            </div>

            <Button className="mt-2 h-10 w-full sm:hidden" variant="outline">
              <Send aria-hidden="true" />
              Send Requirement
            </Button>
          </div>
        </div>
      </section>

      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Browse by need
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal sm:mt-2 sm:text-3xl">
              Popular service categories
            </h2>
          </div>
          <Button variant="outline">
            View all
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Card key={category.name} className="bg-white/90">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground sm:size-11">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold sm:mt-4 sm:text-base">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Available professionals
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AdSlot label="Top ad banner 970 x 90" />
      </section>

      <section id="requirements" className="border-y bg-secondary/70">
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

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.label}
                href={item.href}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
