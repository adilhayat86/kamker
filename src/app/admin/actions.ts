"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function approveProfessional(formData: FormData) {
  const id = formData.get("professionalId");

  if (typeof id !== "string" || !id || !isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase
    .from("professionals")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    console.error("Failed to approve professional", error);
  }

  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function rejectProfessional(formData: FormData) {
  const id = formData.get("professionalId");

  if (typeof id !== "string" || !id || !isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase
    .from("professionals")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Failed to reject professional", error);
  }

  revalidatePath("/admin");
  revalidatePath("/professionals");
}

export async function verifyCnic(formData: FormData) {
  const id = formData.get("professionalId");

  if (typeof id !== "string" || !id || !isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase
    .from("professionals")
    .update({ is_cnic_verified: true })
    .eq("id", id);

  if (error) {
    console.error("Failed to verify CNIC", error);
  }

  revalidatePath("/admin");
  revalidatePath("/professionals");
}
