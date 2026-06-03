"use server";

import { redirect } from "next/navigation";

import { getAutoApproveProfessionals } from "@/lib/admin-settings";
import { hashSecret } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numericField(formData: FormData, key: string) {
  const value = Number(field(formData, key));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export async function registerProfessional(formData: FormData) {
  const fullName = field(formData, "fullName");
  const phoneNumber = field(formData, "phone");
  const whatsappNumber = field(formData, "whatsapp");
  const cityName = field(formData, "city");
  const area = field(formData, "area");
  const categoryName = field(formData, "category");
  const gender = field(formData, "gender");
  const availability = field(formData, "availability");
  const yearsExperience = numericField(formData, "yearsExperience");
  const experience = field(formData, "experience");
  const expectedRate = field(formData, "rate");
  const cnic = field(formData, "cnic");
  const shortBio = field(formData, "bio");
  const password = field(formData, "password");
  const secretQuestion = field(formData, "secretQuestion");
  const secretAnswer = field(formData, "secretAnswer");

  if (
    !fullName ||
    !phoneNumber ||
    !cityName ||
    !categoryName ||
    !gender ||
    !availability ||
    !expectedRate ||
    !password ||
    !secretQuestion ||
    !secretAnswer
  ) {
    redirect("/register/professional?status=missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/register/professional?status=not-configured");
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

  const [passwordHash, secretAnswerHash] = await Promise.all([
    hashSecret(password),
    hashSecret(secretAnswer.toLowerCase()),
  ]);
  const autoApprove = await getAutoApproveProfessionals();

  const { error } = await supabase.from("professionals").insert({
    full_name: fullName,
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber || null,
    city_id: city?.id ?? null,
    area: area || null,
    category_id: category?.id ?? null,
    gender,
    availability,
    years_experience: yearsExperience,
    experience: experience || null,
    expected_rate: expectedRate || null,
    short_bio: shortBio || null,
    cnic: cnic || null,
    password_hash: passwordHash,
    secret_question: secretQuestion,
    secret_answer_hash: secretAnswerHash,
    is_phone_verified: false,
    is_cnic_verified: false,
    is_active: autoApprove,
  });

  if (error) {
    console.error("Failed to register professional", error);
    redirect("/register/professional?status=error");
  }

  redirect("/register/professional?status=success");
}
