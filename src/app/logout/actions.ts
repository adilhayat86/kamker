"use server";

import { redirect } from "next/navigation";

import { clearProfessionalSession } from "@/lib/auth";

export async function logoutProfessional() {
  await clearProfessionalSession();
  redirect("/login");
}
