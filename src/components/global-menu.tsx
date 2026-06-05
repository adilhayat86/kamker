import Link from "next/link";
import {
  Building2,
  ClipboardList,
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
import type { ReactNode } from "react";

import { logoutAdmin } from "@/app/admin/login/actions";
import { logoutProfessional } from "@/app/logout/actions";
import { Badge } from "@/components/ui/badge";
import { GlobalMenuShell } from "@/components/global-menu-shell";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/admin-auth";
import { getSessionProfessional } from "@/lib/auth";

type MenuLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

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

function LogoutButton({
  label,
  action,
}: {
  label: string;
  action: () => void | Promise<void>;
}) {
  return (
    <form action={action}>
      <button className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10">
        <LogOut className="size-4" aria-hidden />
        {label}
      </button>
    </form>
  );
}

const marketplaceLinks: MenuLink[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: ClipboardList },
  { href: "/professionals", label: "Professionals", icon: Users },
  { href: "/send-requirement", label: "Send Requirement", icon: Send },
];

const companyLinks: MenuLink[] = [
  { href: "/company-listings", label: "Company Listings", icon: Building2 },
  { href: "/register/company", label: "Register Company", icon: Building2 },
];

export async function GlobalMenu() {
  const [professional, adminAuthenticated] = await Promise.all([
    getSessionProfessional(),
    isAdminAuthenticated(),
  ]);
  const adminConfigured = isAdminPasswordConfigured();

  return (
    <GlobalMenuShell>
      <div className="mb-2.5 flex items-center justify-between gap-3 border-b pb-2.5">
        <div>
          <p className="text-sm font-bold">Kamker Menu</p>
          <p className="text-xs text-muted-foreground">
            Browse, register, or manage account.
          </p>
        </div>
        {professional ? (
          <Badge variant="secondary">Logged in</Badge>
        ) : (
          <Badge variant="outline">Guest</Badge>
        )}
      </div>

      <div className="grid max-h-[calc(100vh-5.75rem)] gap-3 overflow-y-auto pr-1">
        <MenuSection title="Account">
          {professional ? (
            <>
              <MenuItem href="/account" label="My Profile" icon={User} />
              <MenuItem href="/account/edit" label="Edit Profile" icon={UserCog} />
              <LogoutButton label="Logout" action={logoutProfessional} />
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
          {adminAuthenticated ? (
            <>
              <MenuItem href="/admin" label="Admin Dashboard" icon={LayoutDashboard} />
              <MenuItem href="/admin/companies" label="Admin Companies" icon={Building2} />
              <MenuItem href="/admin/company-listings" label="Admin Listings" icon={ClipboardList} />
              <LogoutButton label="Admin Logout" action={logoutAdmin} />
            </>
          ) : (
            <MenuItem
              href="/admin/login"
              label={adminConfigured ? "Admin Panel Access" : "Admin Setup Required"}
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
