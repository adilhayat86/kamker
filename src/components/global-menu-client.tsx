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
  KeyRound,
  LogIn,
  LogOut,
  Send,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { canShowAdminMenu, guestMenuSession, menuSessionFromResponse, type MenuSession } from "@/lib/menu-session";

import { Badge } from "@/components/ui/badge";
import { GlobalMenuShell } from "@/components/global-menu-shell";
import { NavigationLink } from "@/components/navigation-link";

type MenuLink = {
  href: string;
  label: string;
  icon: LucideIcon;
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
    <NavigationLink
      href={href}
      className="flex min-h-9 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
    >
      <Icon className="size-4 text-primary" aria-hidden />
      {label}
    </NavigationLink>
  );
}

function LogoutLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
    >
      <LogOut className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

export function GlobalMenuClient() {
  const pathname = usePathname();
  const [loadedSession, setLoadedSession] = useState<{ pathname: string; session: MenuSession } | null>(null);
  // A response from another page must never supply privileges for this menu.
  const session = loadedSession?.pathname === pathname ? loadedSession.session : guestMenuSession;
  const isLoggedIn = session.professionalLoggedIn || session.customerLoggedIn;
  const showAdminMenu = canShowAdminMenu(pathname, session);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/menu/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const nextSession = response.ok
          ? menuSessionFromResponse(await response.json())
          : guestMenuSession;
        if (!controller.signal.aborted) setLoadedSession({ pathname, session: nextSession });
      } catch {
        if (!controller.signal.aborted) setLoadedSession({ pathname, session: guestMenuSession });
      }
    }

    void loadSession();
    return () => controller.abort();
  }, [pathname]);

  return (
    <GlobalMenuShell>
      <div className="mb-2.5 flex items-center justify-between gap-3 border-b pb-2.5">
        <div>
          <p className="text-sm font-bold">Kamker Menu</p>
          <p className="text-xs text-muted-foreground">
            {isLoggedIn ? "Browse or manage your account." : "Browse, register, or manage account."}
          </p>
        </div>
        {isLoggedIn ? (
          <Badge variant="secondary">Logged in</Badge>
        ) : (
          <Badge variant="outline">Guest</Badge>
        )}
      </div>

      <div className="grid max-h-[calc(100vh-5.75rem)] gap-3 overflow-y-auto pr-1">
        <MenuSection title="Account">
          {session.professionalLoggedIn ? (
            <>
              <MenuItem href="/account" label="My Account" icon={User} />
              <MenuItem href="/account/edit" label="Edit Profile" icon={UserCog} />
              <MenuItem href="/account/recovery" label="Password recovery" icon={KeyRound} />
              <LogoutLink href="/api/logout/professional" label="Logout" />
            </>
          ) : session.customerLoggedIn ? (
            <>
              <MenuItem href="/send-requirement" label="Send Requirement" icon={Send} />
              <MenuItem href="/categories" label="Browse Categories" icon={ClipboardList} />
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

        {!isLoggedIn ? (
          <MenuSection title="Company">
            {companyLinks.map((item) => (
              <MenuItem key={item.href} {...item} />
            ))}
          </MenuSection>
        ) : null}

        {showAdminMenu ? (
          <MenuSection title="Admin">
              <MenuItem href="/admin" label="Admin Dashboard" icon={LayoutDashboard} />
              <MenuItem href="/admin/workers" label="Admin Workers" icon={Users} />
              <MenuItem href="/admin/companies" label="Admin Companies" icon={Building2} />
              <MenuItem href="/admin/company-listings" label="Admin Listings" icon={ClipboardList} />
              <MenuItem href="/admin/requirements" label="Admin Requirements" icon={Send} />
              <MenuItem href="/admin/payments" label="Admin Payments" icon={CreditCard} />
              <MenuItem href="/admin/analytics" label="Admin Analytics" icon={BarChart3} />
              <MenuItem href="/admin/system" label="System Health" icon={HeartPulse} />
              <LogoutLink href="/admin/logout" label="Admin Logout" />
          </MenuSection>
        ) : null}

        <MenuSection title="Info">
          <MenuItem href="/about" label="About Kamker" icon={Home} />
        </MenuSection>
      </div>
    </GlobalMenuShell>
  );
}
