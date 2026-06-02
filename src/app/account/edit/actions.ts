"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionProfessional } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfessionalProfile(formData: FormData) {
  const fullName = field(formData, "fullName");
  const phoneNumber = field(formData, "phone");
  const whatsappNumber = field(formData, "whatsapp");
  const cityName = field(formData, "city");
  const area = field(formData, "area");
  const categoryName = field(formData, "category");
  const experience = field(formData, "experience");
  const expectedRate = field(formData, "rate");
  const shortBio = field(formData, "bio");

  if (!fullName || !phoneNumber || !cityName || !categoryName) {
    redirect("/account/edit?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/account/edit?status=not-configured");
  }

  const sessionProfessional = await getSessionProfessional();

  if (!sessionProfessional) {
    redirect("/login");
  }

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", cityName)
    .maybeSingle();

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();

  const { error } = await supabase
    .from("professionals")
    .update({
      full_name: fullName,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber || null,
      city_id: city?.id ?? null,
      area: area || null,
      category_id: category?.id ?? null,
      experience: experience || null,
      expected_rate: expectedRate || null,
      short_bio: shortBio || null,
    })
    .eq("id", sessionProfessional.id);

  if (error) {
    console.error("Failed to update professional profile", error);
    redirect("/account/edit?status=error");
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/account/edit");
  revalidatePath("/professionals");
  revalidatePath(`/professionals/${sessionProfessional.id}`);

  redirect("/account?status=updated");
}
