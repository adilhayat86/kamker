import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Home,
  MessageCircle,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import { AdBanner } from "@/components/ad-banner";
import { CategoryGrid } from "@/components/category-grid";
import { SearchPanel } from "@/components/search-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cities, parentCategories } from "@/lib/marketplace-data";

const bottomNavItems = [
  { label: "Home", icon: Home, href: "#" },
  { label: "Categories", icon: ClipboardList, href: "/categories" },
  { label: "Send Requirement", icon: Send, href: "/send-requirement" },
  { label: "Register", icon: BriefcaseBusiness, href: "/register" },
  { label: "Account", icon: User, href: "/account" },
];

const stats = [
  ["50,000+", "Professionals"],
  ["120+", "Categories"],
  ["25+", "Cities"],
  ["Fast", "Response"],
];

const trustItems = ["ID checked", "Phone verified", "Direct contact", "No middleman"];

const steps = [
  ["Browse service groups", "Choose Healthcare, Domestic Help, Education, Repairs, Transport, or Beauty."],
  ["Send your requirement", "Share service, city, area, budget, urgency, and details."],
  ["Register as professional", "Workers can create profiles for review before going active."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden pb-24 md:pb-0">
      <header className="border-b bg-background/95">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2" aria-label="Kamker home">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">K</span>
            <span className="text-xl font-bold tracking-normal">Kamker</span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#categories" className="hover:text-foreground">Categories</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <Link href="/register" className="hover:text-foreground">Register</Link>
          </div>
          <Button asChild size="sm"><Link href="/account">Account</Link></Button>
        </nav>
      </header>

      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <Image src="/kamker-professionals.png" alt="Pakistani service professionals ready for work" fill priority sizes="100vw" className="object-cover object-center opacity-40" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,251,247,0.98)_0%,rgba(251,251,247,0.92)_42%,rgba(251,251,247,0.58)_100%)]" />
        </div>
        <div className="mx-auto grid min-h-[173px] max-w-7xl content-center px-4 py-4 sm:min-h-[416px] sm:px-6 lg:px-8">
          <aside aria-label="Reserved Google Ads space" className="absolute right-4 top-4 hidden min-h-24 w-64 items-center justify-center rounded-lg border border-dashed bg-white/75 px-4 text-center text-xs text-muted-foreground shadow-sm backdrop-blur lg:flex">Google Ads placeholder</aside>
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-2 gap-1.5"><Sparkles className="size-3.5" aria-hidden="true" />Pakistan service marketplace</Badge>
            <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">Find part time workers</h1>
            <p className="mt-2 max-w-xl text-sm leading-5 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-7">Find verified nurses, maids, drivers, tutors, technicians, guards, and home service professionals across Pakistan.</p>
          </div>
        </div>
      </section>

      <section className="border-b bg-background px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SearchPanel />
          <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {cities.map((city) => <Badge key={city} variant="outline" className="shrink-0 bg-white">{city}</Badge>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(([value, label]) => (
            <Card key={label} className="bg-white shadow-sm"><CardContent className="p-5 text-center sm:p-7"><p className="text-2xl font-bold text-primary sm:text-4xl">{value}</p><p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p></CardContent></Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><AdBanner label="Reserved ad space below hero" /></section>

      <section id="requirements" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-primary/20 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-2xl font-bold">Need a Worker?</p><p className="mt-1 text-sm text-white/85">Describe your need and receive responses from professionals.</p></div>
              <Button asChild className="h-14 w-full bg-white text-primary hover:bg-white/90 sm:w-64"><Link href="/send-requirement">Send Requirement</Link></Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-normal text-primary">Popular services</p><h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">Browse by service group</h2></div></div>
        <CategoryGrid categories={parentCategories} />
        <Button asChild variant="outline" className="mt-5 h-12 w-full sm:w-auto"><Link href="/categories">View All Categories</Link></Button>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><AdBanner label="Reserved ad space after categories" /></section>

      <section className="border-y bg-secondary/70">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">Trust and safety</p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">Built for direct, verified hiring</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {trustItems.map((item) => <Card key={item} className="bg-background shadow-sm"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="size-5 text-primary" aria-hidden="true" /><span className="text-sm font-semibold">{item}</span></CardContent></Card>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">How Kamker works</p>
        <h2 className="mt-1 text-2xl font-bold tracking-normal sm:text-3xl">Search, send requirement, or register</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Kamker guides customers to service groups and clear actions instead of promoting selected workers on the homepage.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {steps.map(([title, description], index) => <Card key={title} className="bg-white shadow-sm"><CardContent className="p-5"><div className="flex size-10 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">{index + 1}</div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>)}
        </div>
      </section>

      <section id="join" className="bg-[#14372f] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
          <div><Badge className="bg-white text-[#14372f]">Registration</Badge><h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-normal sm:text-4xl">Join Kamker as a professional or customer.</h2><p className="mt-4 max-w-xl text-base leading-7 text-white/75">Professionals can create verified service profiles. Customers can send requirements and contact matching professionals directly.</p></div>
          <Card className="border-white/15 bg-white/10 text-white shadow-none"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-md bg-white text-[#14372f]"><BriefcaseBusiness className="size-6" aria-hidden="true" /></div><div><h3 className="font-semibold">Register on Kamker</h3><p className="text-sm text-white/70">Choose the path that matches how you use the marketplace.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button asChild className="h-12 bg-white text-[#14372f] hover:bg-white/90"><Link href="/register/professional">Register as Professional</Link></Button><Button asChild className="h-12 bg-white/15 text-white hover:bg-white/25"><Link href="/register/customer">Register as Customer</Link></Button></div></CardContent></Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><AdBanner label="Reserved ad space before footer" /></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><p>Kamker Pakistan service directory marketplace.</p><div className="flex flex-wrap gap-4"><a href="#" className="hover:text-foreground">About</a><a href="#" className="hover:text-foreground">Privacy Policy</a><a href="#" className="hover:text-foreground">Terms</a><a href="#" className="hover:text-foreground">Contact Us</a></div></footer>

      <a href="https://wa.me/" aria-label="WhatsApp help" className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg md:hidden"><MessageCircle className="size-6" aria-hidden="true" /></a>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-2 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return <a key={item.label} href={item.href} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"><Icon className="size-4" aria-hidden="true" /><span>{item.label}</span></a>;
          })}
        </div>
      </nav>
    </main>
  );
}
