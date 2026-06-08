"use client";

import Link from "next/link";
import {
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Send,
  Shield,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { GlobalMenuShell } from "@/components/global-menu-shell";

type MenuLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type MenuSession = {
  professionalLoggedIn: boolean;
  adminAuthenticated: boolean;
  adminConfigured: boolean;
};

const guestSession: MenuSession = {
  professionalLoggedIn: false,
  adminAuthenticated: false,
  adminConfigured: true,
};

const marketplaceLinks: MenuLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: ClipboardList },
  { href: "/professionals", label: "Professionals", icon: Users },
  { href: "/send-requirement", label: "Send Requirement", icon: Send },
];

const companyLinks: MenuLink[] = [
  { href: "/register/company", label: "Register Company", icon: Building2 },
];

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {title}
      </p>
      <div className="grid gap-1">{children}</div>
    </div>
  );
}

function MenuItem({ href, label, icon: Icon }: MenuLink) {
  return (
    <Link
      href={href}
      className="flex min-h-9 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="size-4 text-primary" aria-hidden />
      {label}
    </Link>
  );
}

function LogoutLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
    >
      <LogOut className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

export function GlobalMenuClient() {
  const [session, setSession] = useState<MenuSession>(guestSession);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/menu/session", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const nextSession = (await response.json()) as MenuSession;

        if (!cancelled) {
          setSession({
            professionalLoggedIn: Boolean(nextSession.professionalLoggedIn),
            adminAuthenticated: Boolean(nextSession.adminAuthenticated),
            adminConfigured: Boolean(nextSession.adminConfigured),
          });
        }
      } catch {
        // Keep the static guest menu if session lookup fails.
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlobalMenuShell>
      <div className="mb-2.5 flex items-center justify-between gap-3 border-b pb-2.5">
        <div>
          <p className="text-sm font-bold">Kamker Menu</p>
          <p className="text-xs text-muted-foreground">
            Browse, register, or manage account.
          </p>
        </div>
        {session.professionalLoggedIn ? (
          <Badge variant="secondary">Logged in</Badge>
        ) : (
          <Badge variant="outline">Guest</Badge>
        )}
      </div>

      <div className="grid max-h-[calc(100vh-5.75rem)] gap-3 overflow-y-auto pr-1">
        <MenuSection title="Account">
          {session.professionalLoggedIn ? (
            <>
              <MenuItem href="/account" label="My Profile" icon={User} />
              <MenuItem href="/account/edit" label="Edit Profile" icon={UserCog} />
              <LogoutLink href="/api/logout/professional" label="Logout" />
            </>
          ) : (
            <>
              <MenuItem href="/login" label="Login" icon={LogIn} />
              <MenuItem href="/register" label="Register" icon={User} />
            </>
          )}
        </MenuSection>

        <MenuSection title="Marketplace">
          {marketplaceLinks.map((item) => (
            <MenuItem key={item.href} {...item} />
          ))}
        </MenuSection>

        <MenuSection title="Company">
          {companyLinks.map((item) => (
            <MenuItem key={item.href} {...item} />
          ))}
        </MenuSection>

        <MenuSection title="Admin">
          {session.adminAuthenticated ? (
            <>
              <MenuItem href="/admin" label="Admin Dashboard" icon={LayoutDashboard} />
              <MenuItem href="/admin/workers" label="Admin Workers" icon={Users} />
              <MenuItem href="/admin/companies" label="Admin Companies" icon={Building2} />
              <MenuItem href="/admin/company-listings" label="Admin Listings" icon={ClipboardList} />
              <MenuItem href="/admin/requirements" label="Admin Requirements" icon={Send} />
              <MenuItem href="/admin/payments" label="Admin Payments" icon={CreditCard} />
              <MenuItem href="/admin/analytics" label="Admin Analytics" icon={BarChart3} />
              <MenuItem href="/admin/system" label="System Health" icon={HeartPulse} />
              <LogoutLink href="/admin/logout" label="Admin Logout" />
            </>
          ) : (
            <MenuItem
              href="/admin/login"
              label={session.adminConfigured ? "Admin Panel Access" : "Admin Setup Required"}
              icon={Shield}
            />
          )}
        </MenuSection>

        <MenuSection title="Info">
          <MenuItem href="/about" label="About Kamker" icon={Home} />
        </MenuSection>
      </div>
    </GlobalMenuShell>
  );
}
