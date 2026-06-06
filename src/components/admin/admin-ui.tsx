import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  CreditCard,
  FileClock,
  HeartPulse,
  Home,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { DismissibleCard } from "@/components/dismissible-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/workers", label: "Workers", icon: Users },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/company-listings", label: "Company Staff", icon: BriefcaseBusiness },
  { href: "/admin#requirements", label: "Requirements", icon: ClipboardList },
  { href: "/admin/payments", label: "Payments & Proofs", icon: CreditCard },
  { href: "/admin/featured", label: "Featured", icon: Sparkles },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/system", label: "System Health", icon: HeartPulse },
  { href: "/admin/audit", label: "Audit Log", icon: FileClock },
];

export function AdminShell({
  children,
  title,
  description,
  active,
  actions,
}: {
  children: ReactNode;
  title: string;
  description: string;
  active: string;
  actions?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border bg-white p-3 shadow-sm lg:sticky lg:top-6 lg:h-fit">
          <div className="px-2 py-3">
            <p className="text-xs font-semibold uppercase tracking-normal text-primary">
              Kamker Admin
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Operations command center
            </p>
          </div>
          <nav className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {adminLinks.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/">Public Site</Link>
          </Button>
        </aside>

        <div className="min-w-0">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant="secondary" className="gap-1.5">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Protected admin
                </Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-normal">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
              {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

export function AdminStatCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "urgent" | "good" | "warning";
}) {
  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-3 text-3xl font-bold",
            tone === "urgent" && "text-red-600",
            tone === "good" && "text-emerald-600",
            tone === "warning" && "text-amber-600",
          )}
        >
          {value}
        </p>
        {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

export function AdminSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="mt-6 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
        <div className="mt-5">{children}</div>
      </CardContent>
    </Card>
  );
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-slate-50 p-5 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function AdminWarning({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <DismissibleCard
      className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
      cardContentClassName="p-4"
      contentClassName="flex gap-3"
      closeLabel="Close admin warning"
    >
      <MessageCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 text-sm text-amber-900">{children}</div>
      </div>
    </DismissibleCard>
  );
}

export function AdminMetaGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2">
          <span className="font-medium text-foreground">{item.label}: </span>
          {item.value}
        </div>
      ))}
    </div>
  );
}

export function AdminStatusBadge({ children }: { children: ReactNode }) {
  return <Badge variant="outline">{children}</Badge>;
}
