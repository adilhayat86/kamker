"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearProfessionalSession,
  getSessionProfessional,
} from "@/lib/auth";
import { deleteLocalProfessionalRecordById } from "@/lib/local-demo-store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function deleteOwnProfessionalProfile(formData: FormData) {
  const confirmation = formData.get("confirmDeleteProfile");

  if (confirmation !== "DELETE") {
    redirect("/account?status=delete-confirmation");
  }

  const professional = await getSessionProfessional();

  if (!professional) {
    redirect("/login");
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from("professionals")
      .delete()
      .eq("id", professional.id);

    if (error) {
      console.error("Failed to delete own professional profile", error);
      redirect("/account?status=delete-error");
    }
  } else {
    await deleteLocalProfessionalRecordById(professional.id);
  }

  await clearProfessionalSession();
  revalidatePath("/");
  revalidatePath("/professionals");
  revalidatePath("/account");
  redirect("/login?status=profile-deleted");
}
