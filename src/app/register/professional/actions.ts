"use server";

import { redirect } from "next/navigation";

import { getAutoApproveProfessionals } from "@/lib/admin-settings";
import {
  isWorkerDayAvailability,
  isWorkerTimeAvailability,
  workerAvailabilitySummary,
} from "@/lib/worker-availability";
import { createProfessionalSession, hashSecret } from "@/lib/auth";
import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import {
  isLocalDemoStoreEnabled,
  saveLocalProfessional,
} from "@/lib/local-demo-store";
import { uploadProfessionalPhoto } from "@/lib/professional-photo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numericField(formData: FormData, key: string) {
  const value = Number(field(formData, key));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

async function saveProfessionalDraft(input: {
  fullName: string;
  phoneNumber: string;
  whatsappNumber: string;
  cityName: string;
  area: string;
  categoryName: string;
  gender: string;
  availabilityTime: string;
  availabilityDays: string;
  yearsExperience: number;
  experience: string;
  expectedRate: string;
  tagline: string;
  shortBio: string;
  secretQuestion: string;
}) {
  await saveFormDraft("professional", {
    fullName: input.fullName,
    phone: input.phoneNumber,
    whatsapp: input.whatsappNumber,
    city: input.cityName,
    area: input.area,
    category: input.categoryName,
    gender: input.gender,
    availabilityTime: input.availabilityTime,
    availabilityDays: input.availabilityDays,
    yearsExperience: input.yearsExperience,
    experience: input.experience,
    rate: input.expectedRate,
    tagline: input.tagline,
    bio: input.shortBio,
    secretQuestion: input.secretQuestion,
  });
}

export async function registerProfessional(formData: FormData) {
  const fullName = field(formData, "fullName");
  const phoneNumber = field(formData, "phone");
  const whatsappNumber = field(formData, "whatsapp");
  const cityName = field(formData, "city");
  const area = field(formData, "area");
  const categoryName = field(formData, "category");
  const gender = field(formData, "gender");
  const availabilityTime = field(formData, "availabilityTime");
  const availabilityDays = field(formData, "availabilityDays");
  const yearsExperience = numericField(formData, "yearsExperience");
  const experience = field(formData, "experience");
  const expectedRate = field(formData, "rate");
  const tagline = field(formData, "tagline");
  const cnic = field(formData, "cnic");
  const shortBio = field(formData, "bio");
  const password = field(formData, "password");
  const secretQuestion = field(formData, "secretQuestion");
  const secretAnswer = field(formData, "secretAnswer");
  const draftInput = {
    fullName,
    phoneNumber,
    whatsappNumber,
    cityName,
    area,
    categoryName,
    gender,
    availabilityTime,
    availabilityDays,
    yearsExperience,
    experience,
    expectedRate,
    tagline,
    shortBio,
    secretQuestion,
  };

  if (
    !fullName ||
    !phoneNumber ||
    !cityName ||
    !categoryName ||
    !gender ||
    !isWorkerTimeAvailability(availabilityTime) ||
    !isWorkerDayAvailability(availabilityDays) ||
    !expectedRate ||
    !tagline ||
    tagline.length > 30 ||
    !password ||
    !secretQuestion ||
    !secretAnswer
  ) {
    await saveProfessionalDraft(draftInput);
    redirect("/register/professional?status=missing");
  }

  const [passwordHash, secretAnswerHash] = await Promise.all([
    hashSecret(password),
    hashSecret(secretAnswer.toLowerCase()),
  ]);

  if (!isSupabaseConfigured || !supabase) {
    if (isLocalDemoStoreEnabled) {
      const professional = await saveLocalProfessional({
        fullName,
        phoneNumber,
        whatsappNumber,
        cityName,
        area,
        categoryName,
        gender,
        availabilityTime,
        availabilityDays,
        yearsExperience,
        experience,
        expectedRate,
        tagline,
        shortBio,
        passwordHash,
        secretQuestion,
        secretAnswerHash,
      });
      await clearFormDraft("professional");
      if (professional) {
        await createProfessionalSession(professional.id);
      }
      redirect("/account?status=registered");
    }

    await saveProfessionalDraft(draftInput);
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

  const autoApprove = await getAutoApproveProfessionals();
  let profilePhotoUrl: string | null = null;
  const availability = workerAvailabilitySummary(
    availabilityTime,
    availabilityDays,
  );

  try {
    profilePhotoUrl = await uploadProfessionalPhoto(formData);
  } catch (error) {
    await saveProfessionalDraft(draftInput);
    redirect(
      error instanceof Error && error.message === "invalid-photo"
        ? "/register/professional?status=invalid-photo"
        : "/register/professional?status=photo-error",
    );
  }

  const { data: professional, error } = await supabase
    .from("professionals")
    .insert({
      full_name: fullName,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber || null,
      city_id: city?.id ?? null,
      area: area || null,
      category_id: category?.id ?? null,
      gender,
      availability,
      availability_time: availabilityTime,
      availability_days: availabilityDays,
      years_experience: yearsExperience,
      experience: experience || null,
      expected_rate: expectedRate || null,
      tagline,
      short_bio: shortBio || null,
      cnic: cnic || null,
      profile_photo_url: profilePhotoUrl,
      password_hash: passwordHash,
      secret_question: secretQuestion,
      secret_answer_hash: secretAnswerHash,
      is_phone_verified: false,
      is_cnic_verified: false,
      is_active: autoApprove,
    })
    .select("id")
    .single();

  if (error || !professional) {
    console.error("Failed to register professional", error);
    await saveProfessionalDraft(draftInput);
    redirect("/register/professional?status=error");
  }

  await createProfessionalSession(professional.id as string);
  await clearFormDraft("professional");
  redirect("/account?status=registered");
}
