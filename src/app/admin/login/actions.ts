"use server";

import { redirect } from "next/navigation";

import { recordAdminAudit } from "@/lib/admin-audit";
import {
  clearAdminSession,
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    redirect("/admin/login?status=invalid");
  }

  await createAdminSession();
  await recordAdminAudit({ action: "admin_login", targetType: "admin_session" });
  redirect("/admin");
}

export async function logoutAdmin() {
  await recordAdminAudit({ action: "admin_logout", targetType: "admin_session" });
  await clearAdminSession();
  redirect("/admin/login");
}
