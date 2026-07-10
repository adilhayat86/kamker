import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Home,
  PhoneCall,
  Send,
  Sparkles,
  User,
  Users,
} from "lucide-react";

import { AdBanner } from "@/components/ad-banner";
import { CategoryGrid } from "@/components/category-grid";
import { KamkerLogo } from "@/components/kamker-logo";
import { SearchPanel } from "@/components/search-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCityOptions } from "@/lib/city-options";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { categories, cities, parentCategories } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const revalidate = 120;

const guestBottomNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Categories", icon: ClipboardList, href: "/categories" },
  { label: "Professionals", icon: Users, href: "/professionals" },
  { label: "Register", icon: BriefcaseBusiness, href: "/register" },
  { label: "Login", icon: User, href: "/login" },
];

const loggedInBottomNavItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Categories", icon: ClipboardList, href: "/categories" },
  { label: "Professionals", icon: Users, href: "/professionals" },
  { label: "Send Req.", icon: Send, href: "/send-requirement" },
  { label: "Account", icon: User, href: "/account" },
];

const trustItems = [
  "Register free",
  "No commission from workers",
  "Find workers by category and city",
  "Contact directly by WhatsApp/call where available",
];

const loggedInTrustItems = [
  "No commission from workers",
  "Find workers by category and city",
  "Contact directly by WhatsApp/call where available",
  "Paid requirement broadcast available",
];

const steps = [
  ["Browse service groups", "Choose Healthcare, Domestic Help, Education, Repairs, Transport, Office, or Beauty."],
  ["Find matching workers", "Use category and city filters to shortlist workers quickly."],
  ["Register", "Workers, companies, and customers choose the right registration path."],
];

const loggedInSteps = [
  ["Browse service groups", "Choose Healthcare, Domestic Help, Education, Repairs, Transport, Office, or Beauty."],
  ["Find matching workers", "Use category and city filters to shortlist workers quickly."],
  ["Continue from account", "Manage your profile or send a paid requirement broadcast from your logged-in session."],
];

const popularSearchLinks = [
  ["Part time workers", "/part-time-workers"],
  ["Part time maids", "/part-time-maids"],
  ["Part time nurses", "/part-time-nurses"],
  ["Part time drivers", "/part-time-drivers"],
  ["Part time tutors", "/part-time-tutors"],
  ["Workers in Karachi", "/part-time-workers/karachi"],
  ["Workers in Lahore", "/part-time-workers/lahore"],
  ["Maids in Lahore", "/part-time-maids/lahore"],
  ["Nurses in Karachi", "/part-time-nurses/karachi"],
];

const homepageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Kamker",
      url: "https://kamker.com",
      logo: "https://kamker.com/kamker-logo-old-wordmark.png",
      description:
        "Kamker helps customers find part time workers and professionals by category and city across Pakistan.",
    },
    {
      "@type": "WebSite",
      name: "Kamker",
      url: "https://kamker.com",
      description:
        "Find nurses, maids, drivers, tutors, cooks, guards, and other part time workers by city in Pakistan.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://kamker.com/professionals?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

function formatStatCount(value: number) {
  return value.toLocaleString("en-PK");
}

function isExpectedStatsFetchFailure(error: { message?: string; details?: string }) {
  return (
    error.message?.includes("fetch failed") ||
    error.details?.includes("fetch failed")
  );
}

async function countRows(table: string, filters?: Record<string, string | boolean>) {
  if (!supabase) {
    return null;
  }

  let query = supabase.from(table).select("id", { count: "exact", head: true });

  Object.entries(filters ?? {}).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { count, error } = await query;

  if (error) {
    if (!isExpectedStatsFetchFailure(error)) {
      console.error(`Failed to load homepage ${table} count`, error);
    }

    return null;
  }

  return count ?? 0;
}

const getHomepageStats = unstable_cache(async function getHomepageStats() {
  if (!isSupabaseConfigured || !supabase) {
    return [
      ["Live", "Directory"],
      ["Verified", "Profiles"],
      ["City", "Filters"],
      ["Direct", "Contact"],
    ];
  }

  const [
    professionalCount,
    companyStaffCount,
    categoryCount,
    cityCount,
    companyCount,
  ] = await Promise.all([
    countRows("professionals", { is_active: true }),
    countRows("company_listings", { status: "approved" }),
    countRows("categories"),
    countRows("cities"),
    countRows("companies"),
  ]);

  const totalProfessionals =
    professionalCount === null && companyStaffCount === null
      ? null
      : (professionalCount ?? 0) + (companyStaffCount ?? 0);

  return [
    [
      totalProfessionals === null ? "Live" : formatStatCount(totalProfessionals),
      totalProfessionals === null ? "Directory" : "Professionals",
    ],
    [
      categoryCount === null ? formatStatCount(categories.length) : formatStatCount(categoryCount),
      "Categories",
    ],
    [
      cityCount === null ? formatStatCount(cities.length) : formatStatCount(cityCount),
      "Cities",
    ],
    [
      companyCount === null ? "Growing" : formatStatCount(companyCount),
      "Companies",
    ],
  ];
}, ["homepage-stats"], { revalidate: 60 });

export default async function HomePage() {
  const [stats, cityOptions, professional, customer] = await Promise.all([
    getHomepageStats(),
    getCityOptions(),
    getSessionProfessional(),
    getSessionCustomer(),
  ]);
  const isLoggedIn = Boolean(professional || customer);
  const primarySessionHref = professional ? "/account" : "/send-requirement";
  const primarySessionLabel = professional ? "My Account" : "Send Requirement";
  const activeTrustItems = isLoggedIn ? loggedInTrustItems : trustItems;
  const activeSteps = isLoggedIn ? loggedInSteps : steps;
  const bottomNavItems = isLoggedIn ? loggedInBottomNavItems : guestBottomNavItems;

  return (
    <main className="min-h-screen overflow-hidden pb-24 md:pb-0">
      <header className="border-b bg-background/95">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 pr-16 sm:px-6 sm:pr-20 lg:px-8 lg:pr-20">
          <KamkerLogo />
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn ? (
              <Button asChild size="sm" variant="outline" className="h-9 border-primary/30 bg-white text-primary">
                <Link href={primarySessionHref}>Account</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="h-9 border-primary/30 bg-white text-primary">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#categories" className="hover:text-foreground">Categories</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            {isLoggedIn ? (
              <Link href={primarySessionHref} className="hover:text-foreground">{primarySessionLabel}</Link>
            ) : (
              <>
                <Link href="/login" className="font-semibold text-primary hover:text-primary/80">Login</Link>
                <Link href="/register" className="hover:text-foreground">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <Image src="/kamker-professionals.png" alt="Pakistani service professionals ready for work" fill priority sizes="100vw" className="object-cover object-center opacity-40" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,251,247,0.98)_0%,rgba(251,251,247,0.92)_42%,rgba(251,251,247,0.58)_100%)]" />
        </div>
        <div className="mx-auto grid min-h-[164px] max-w-7xl content-center px-4 py-4 sm:min-h-[380px] sm:px-6 lg:px-8">
          <aside aria-label="Reserved Google Ads space" className="absolute right-4 top-4 hidden min-h-24 w-64 items-center justify-center rounded-lg border border-dashed bg-white/75 px-4 text-center text-xs text-muted-foreground shadow-sm backdrop-blur lg:flex">Google Ads placeholder</aside>
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-2 gap-1.5"><Sparkles className="size-3.5" aria-hidden="true" />Pakistan service marketplace</Badge>
            <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">Find part time workers</h1>
            <p className="mt-2 max-w-xl text-sm leading-5 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-7">Coming from a newspaper ad? Search by service and city, choose a category, or contact matching workers.</p>
            <div className="mt-4 grid gap-2 sm:flex sm:max-w-xl">
              {isLoggedIn ? (
                <Button asChild variant="outline" className="h-12 border-primary/30 bg-white text-base font-semibold text-primary hover:bg-accent"><Link href={primarySessionHref}>{professional ? <User aria-hidden="true" /> : <Send aria-hidden="true" />}{primarySessionLabel}</Link></Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="h-12 border-primary/30 bg-white text-base font-semibold text-primary hover:bg-accent"><Link href="/register"><BriefcaseBusiness aria-hidden="true" />Register</Link></Button>
                  <Button asChild variant="ghost" className="h-12 justify-start px-0 text-base font-semibold text-primary hover:bg-transparent hover:text-primary/80 sm:px-4"><Link href="/login"><User aria-hidden="true" />Already registered? Login</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-background px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SearchPanel cityOptions={cityOptions} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"><AdBanner label="Reserved ad space below hero" /></section>

      <section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-normal text-primary">Popular services</p><h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">Browse by service group</h2></div></div>
        <CategoryGrid categories={parentCategories} />
        <Button asChild variant="outline" className="mt-5 h-12 w-full sm:w-auto"><Link href="/categories">View All Categories</Link></Button>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(([value, label]) => (
            <Card key={label} className="border-primary/10 bg-white shadow-sm"><CardContent className="p-4 text-center sm:p-6"><p className="text-2xl font-bold text-primary sm:text-4xl">{value}</p><p className="mt-1.5 text-sm font-semibold text-muted-foreground">{label}</p></CardContent></Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"><AdBanner label="Reserved ad space after categories" /></section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">
          Popular searches
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">
          Find workers by city and service
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {popularSearchLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="rounded-full border border-sky-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-primary hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">Trust and safety</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">Simple for workers and customers</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {activeTrustItems.map((item) => <Card key={item} className="bg-background shadow-sm"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="size-5 text-primary" aria-hidden="true" /><span className="text-sm font-semibold">{item}</span></CardContent></Card>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">How Kamker works</p>
        <h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">{isLoggedIn ? "Search, browse, or continue" : "Search, browse, or register"}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Kamker guides customers to service groups, city filters, and worker profiles without becoming a job board.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {activeSteps.map(([title, description], index) => <Card key={title} className="bg-white shadow-sm"><CardContent className="p-5"><div className="flex size-10 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">{index + 1}</div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>)}
        </div>
      </section>

      {isLoggedIn ? (
        <section id="join" className="bg-primary text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
            <div><Badge className="bg-white text-primary">Welcome back</Badge><h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-normal sm:text-4xl">Continue using Kamker.</h2><p className="mt-4 max-w-xl text-base leading-7 text-white/85">Browse workers, manage your account, or send a paid requirement broadcast to matching professionals.</p></div>
            <Card className="border-white/15 bg-white/10 text-white shadow-none"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-md bg-white text-primary"><PhoneCall className="size-6" aria-hidden="true" /></div><div><h3 className="font-semibold">{primarySessionLabel}</h3><p className="text-sm text-white/80">Continue from your logged-in session.</p></div></div><Button asChild className="mt-5 h-12 w-full bg-white text-primary hover:bg-white/90"><Link href={primarySessionHref}>{primarySessionLabel}</Link></Button></CardContent></Card>
          </div>
        </section>
      ) : (
        <section id="join" className="bg-primary text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
            <div><Badge className="bg-white text-primary">Registration</Badge><h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-normal sm:text-4xl">Join Kamker as a worker or customer.</h2><p className="mt-4 max-w-xl text-base leading-7 text-white/85">Workers register free. Customers browse by category and city, then contact workers directly where phone or WhatsApp is available.</p></div>
            <Card className="border-white/15 bg-white/10 text-white shadow-none"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-md bg-white text-primary"><PhoneCall className="size-6" aria-hidden="true" /></div><div><h3 className="font-semibold">Register on Kamker</h3><p className="text-sm text-white/80">Choose worker, company, or customer registration.</p></div></div><Button asChild className="mt-5 h-12 w-full bg-white text-primary hover:bg-white/90"><Link href="/register">Register</Link></Button></CardContent></Card>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><AdBanner label="Reserved ad space before footer" /></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>Kamker Pakistan service directory marketplace.</p><div className="flex flex-wrap gap-4"><Link href="/about" className="hover:text-foreground">About</Link><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link><Link href="/terms" className="hover:text-foreground">Terms</Link><Link href="/contact" className="hover:text-foreground">Contact Us</Link></div></footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return <a key={item.label} href={item.href} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"><Icon className="size-4" aria-hidden="true" /><span>{item.label}</span></a>;
          })}
        </div>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
    </main>
  );
}
