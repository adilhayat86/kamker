"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionProfessional } from "@/lib/auth";
import { verifyPhotoIntent, recordPhotoAttachment } from "@/lib/photo-intents";
import { supabase } from "@/lib/supabase";

export async function saveAccountPhoto(form: FormData) {
  const worker = await getSessionProfessional();
  if (!worker) redirect("/login");
  const id = form.get("photoIntentId");
  if (!supabase || typeof id !== "string" || !id) redirect("/account/photo?status=choose-photo");
  let photo;
  try { photo = await verifyPhotoIntent(id, worker.id, "professional-photos"); }
  catch { redirect("/account/photo?status=photo-error"); }
  const { error } = await supabase.from("professionals").update({ profile_photo_url: photo.url }).eq("id", worker.id);
  if (error) redirect("/account/photo?status=save-error");
  await recordPhotoAttachment(id, worker.id);
  revalidatePath("/account");
  revalidatePath("/professionals");
  revalidatePath(`/professionals/${worker.id}`);
  redirect("/account?status=photo-saved");
}
