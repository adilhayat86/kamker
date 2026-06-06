"use server";

import { redirect } from "next/navigation";

import { recordAdminAudit } from "@/lib/admin-audit";
import {
  type AdminRole,
  clearAdminSession,
  createAdminSession,
  createAdminResetToken,
  getAdminSessionRole,
  consumeAdminResetToken,
  adminOwnerEmail,
  requireOwnerAdmin,
  updateAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { sendAdminPasswordResetEmail } from "@/lib/admin-email";

function adminRole(value: FormDataEntryValue | null): AdminRole {
  return value === "manager" ? "manager" : "owner";
}

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password");
  const role = adminRole(formData.get("role"));

  if (typeof password !== "string" || !(await verifyAdminPassword(role, password))) {
    redirect("/admin/login?status=invalid");
  }

  await createAdminSession(role);
  await recordAdminAudit({
    action: "admin_login",
    targetType: "admin_session",
    metadata: { role },
  });
  redirect("/admin");
}

export async function logoutAdmin() {
  const role = await getAdminSessionRole();
  await recordAdminAudit({
    action: "admin_logout",
    targetType: "admin_session",
    metadata: { role: role ?? "unknown" },
  });
  await clearAdminSession();
  redirect("/admin/login");
}

export async function changeAdminPassword(formData: FormData) {
  if (!(await requireOwnerAdmin())) {
    redirect("/admin/change-password?status=owner-required");
  }

  const role = adminRole(formData.get("role"));
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof newPassword !== "string" ||
    newPassword.length < 6 ||
    newPassword !== confirmPassword
  ) {
    redirect("/admin/change-password?status=invalid");
  }

  const result = await updateAdminPassword(role, newPassword);

  if (!result.ok) {
    redirect(`/admin/change-password?status=${result.reason}`);
  }

  await recordAdminAudit({
    action: "change_admin_password",
    targetType: "admin_password",
    targetId: role,
  });

  redirect("/admin/change-password?status=changed");
}

export async function requestAdminPasswordReset(formData: FormData) {
  const role = adminRole(formData.get("role"));
  const result = await createAdminResetToken(role);

  if (!result.ok) {
    redirect(`/admin/forgot-password?status=${result.reason}`);
  }

  const resetToken = result.token;
  if (!resetToken) {
    redirect("/admin/forgot-password?status=error");
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
    : "";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || vercelUrl || "http://127.0.0.1:3000";
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/admin/reset-password?role=${role}&token=${encodeURIComponent(resetToken)}`;
  const emailResult = await sendAdminPasswordResetEmail({
    to: adminOwnerEmail(),
    resetUrl,
    role,
  });

  await recordAdminAudit({
    action: "request_admin_password_reset",
    targetType: "admin_password",
    targetId: role,
    metadata: { email: adminOwnerEmail(), emailSent: emailResult.ok },
  });

  redirect(`/admin/forgot-password?status=${emailResult.ok ? "sent" : emailResult.reason}`);
}

export async function resetAdminPassword(formData: FormData) {
  const role = adminRole(formData.get("role"));
  const token = formData.get("token");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof token !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 6 ||
    newPassword !== confirmPassword
  ) {
    redirect("/admin/reset-password?status=invalid");
  }

  const result = await consumeAdminResetToken(role, token, newPassword);

  if (!result.ok) {
    redirect(`/admin/reset-password?status=${result.reason}`);
  }

  await recordAdminAudit({
    action: "reset_admin_password",
    targetType: "admin_password",
    targetId: role,
  });

  redirect("/admin/login?status=reset");
}
