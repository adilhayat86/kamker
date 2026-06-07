import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

import { AdminSection, AdminShell, AdminWarning } from "@/components/admin/admin-ui";
import { DismissibleNotice } from "@/components/dismissible-notice";
import { Button } from "@/components/ui/button";
import {
  getAdminSessionRole,
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";

import { changeAdminPassword } from "../login/actions";

export const metadata = {
  title: "Change Admin Password | Kamker",
};

export const dynamic = "force-dynamic";

const statusMessages = {
  changed: "Admin password updated.",
  invalid: "Use matching passwords with at least 6 characters.",
  "owner-required": "Only the owner admin can change admin passwords.",
  "not-configured": "Supabase must be configured before password changes can be stored.",
  error: "Password could not be updated. Try again.",
} as const;

type ChangeAdminPasswordPageProps = {
  searchParams?: Promise<{
    status?: keyof typeof statusMessages;
  }>;
};

export default async function ChangeAdminPasswordPage({
  searchParams,
}: ChangeAdminPasswordPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const role = await getAdminSessionRole();
  const params = await searchParams;
  const statusMessage = params?.status ? statusMessages[params.status] : null;

  return (
    <AdminShell
      active="/admin/settings"
      title="Change Admin Password"
      description="Owner admins can update owner and manager passwords. Passwords are stored as hashes when Supabase is configured."
    >
      {role !== "owner" ? (
        <AdminWarning title="Owner access required">
          Login as owner to change admin passwords. Manager admins can use the admin panel, but cannot rotate credentials.
        </AdminWarning>
      ) : null}

      <AdminSection
        title="Admin credentials"
        description="Use a different strong password for owner and manager access before production launch."
      >
        <form action={changeAdminPassword} className="grid max-w-lg gap-4 rounded-lg border bg-slate-50 p-4">
          {statusMessage ? (
            <DismissibleNotice className="rounded-lg border bg-white p-4 text-sm font-medium" closeLabel="Close password message">
              {statusMessage}
            </DismissibleNotice>
          ) : null}
          <label className="grid gap-2">
            <span className="text-sm font-medium">Role to update</span>
            <select
              name="role"
              defaultValue="manager"
              disabled={role !== "owner"}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">New password</span>
            <input
              name="newPassword"
              type="password"
              minLength={6}
              disabled={role !== "owner"}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="At least 6 characters"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Confirm password</span>
            <input
              name="confirmPassword"
              type="password"
              minLength={6}
              disabled={role !== "owner"}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Repeat new password"
            />
          </label>
          <Button className="h-11 gap-2" disabled={role !== "owner"}>
            <KeyRound className="size-4" aria-hidden="true" />
            Update Password
          </Button>
        </form>
      </AdminSection>
    </AdminShell>
  );
}
