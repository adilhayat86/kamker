"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function requiredValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function submitRequirement(formData: FormData) {
  const requiredService = requiredValue(formData, "service");
  const cityName = requiredValue(formData, "city");
  const area = requiredValue(formData, "area");
  const budget = requiredValue(formData, "budget");
  const phoneNumber = requiredValue(formData, "phone");
  const whatsappNumber = requiredValue(formData, "whatsapp");
  const urgency = requiredValue(formData, "urgency");
  const details = requiredValue(formData, "details");

  if (!requiredService || !cityName || !phoneNumber || !urgency || !details) {
    redirect("/send-requirement?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/send-requirement?status=not-configured");
  }

  const { data: city } = await supabase
    .from("cities")
    .select("id")
    .eq("name", cityName)
    .maybeSingle();

  const { error } = await supabase.from("requirements").insert({
    required_service: requiredService,
    city_id: city?.id ?? null,
    area: area || null,
    details,
    budget: budget || null,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber || null,
    urgency,
    broadcast_status: "pending_payment",
    status: "open",
  });

  if (error) {
    console.error("Failed to submit requirement", error);
    redirect("/send-requirement?status=error");
  }

  redirect("/send-requirement?status=success");
}
