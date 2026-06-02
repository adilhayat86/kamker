"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerCustomer(formData: FormData) {
  const fullName = field(formData, "fullName");
  const phoneNumber = field(formData, "phone");
  const cityName = field(formData, "city");
  const area = field(formData, "area");

  if (!fullName || !phoneNumber || !cityName) {
    redirect("/register/customer?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/register/customer?status=not-configured");
  }

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", cityName)
    .maybeSingle();

  const { error } = await supabase.from("customers").insert({
    full_name: fullName,
    phone_number: phoneNumber,
    city_id: city?.id ?? null,
    area: area || null,
  });

  if (error) {
    console.error("Failed to register customer", error);
    redirect("/register/customer?status=error");
  }

  redirect("/register/customer?status=success");
}
