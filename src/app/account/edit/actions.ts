"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  findProfessionalsByPhone,
  getSessionProfessional,
  hashSecret,
} from "@/lib/auth";
import {
  normalizePakistanMobilePhone,
  validatePhoneFieldWithCountry,
} from "@/lib/phone";
import { uploadProfessionalPhoto } from "@/lib/professional-photo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  isWorkerDayAvailability,
  isWorkerTimeAvailability,
  type WorkerDayAvailability,
  type WorkerTimeAvailability,
  workerAvailabilitySummary,
} from "@/lib/worker-availability";
import {
  parseWorkerAge,
  parseWorkerHourlyRate,
} from "@/lib/worker-profile-limits";

function field(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function numericField(formData: FormData, key: string) {
  const value = Number(field(formData, key));

  return Number.isFinite(value) && value >= 0 ? value : 0;
}

const defaultWorkerTagline = "Trusted local worker";

function isDuplicatePhoneDatabaseError(error: {
  code?: string;
  message?: string;
  details?: string;
} | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();

  return error?.code === "23505" && text.includes("phone_normalized");
}

export async function updateProfessionalProfile(formData: FormData) {
  const fullName = field(formData, "fullName");
  const phoneInput = field(formData, "phone");
  const phoneValidation = normalizePakistanMobilePhone(phoneInput);
  const phoneNumber = phoneValidation.normalized || phoneInput;
  const whatsappValidation = validatePhoneFieldWithCountry(formData, "whatsapp");
  const whatsappNumber = whatsappValidation.normalized;
  const cityName = field(formData, "city");
  const area = field(formData, "area");
  const categoryName = field(formData, "category");
  const gender = field(formData, "gender");
  const age = parseWorkerAge(field(formData, "age"));
  const availabilityTime = field(formData, "availabilityTime");
  const availabilityDays = field(formData, "availabilityDays");
  const yearsExperience = numericField(formData, "yearsExperience");
  const experience = field(formData, "experience");
  const expectedRate = parseWorkerHourlyRate(field(formData, "rate"));
  const tagline = field(formData, "tagline");
  const shortBio = field(formData, "bio");
  const cnic = field(formData, "cnic");
  const secretQuestion = field(formData, "secretQuestion");
  const secretAnswer = field(formData, "secretAnswer");

  if (phoneInput && !phoneValidation.ok) {
    redirect("/account/edit?status=phone-invalid");
  }

  if (!whatsappValidation.ok) {
    redirect("/account/edit?status=whatsapp-invalid");
  }

  if (
    !fullName ||
    !phoneInput ||
    !cityName ||
    !categoryName ||
    !gender ||
    age === null ||
    !isWorkerTimeAvailability(availabilityTime) ||
    !isWorkerDayAvailability(availabilityDays) ||
    expectedRate === null ||
    yearsExperience < 0
  ) {
    redirect("/account/edit?status=missing");
  }

  if (tagline && tagline.length > 30) {
    redirect("/account/edit?status=tagline-invalid");
  }

  if ((secretQuestion && !secretAnswer) || (!secretQuestion && secretAnswer)) {
    redirect("/account/edit?status=recovery-missing");
  }

  if (!isSupabaseConfigured || !supabase) {
    redirect("/account/edit?status=not-configured");
  }

  const sessionProfessional = await getSessionProfessional();

  if (!sessionProfessional) {
    redirect("/login");
  }

  const duplicateProfessionals = await findProfessionalsByPhone(
    phoneValidation.normalized,
  );
  const duplicateProfessional = duplicateProfessionals.find(
    (professional) => professional.id !== sessionProfessional.id,
  );

  if (duplicateProfessional) {
    redirect("/account/edit?status=duplicate-phone");
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
  let profilePhotoUrl: string | null = field(formData, "profilePhotoUrl") || null;

  if (!profilePhotoUrl) {
    try {
      profilePhotoUrl = await uploadProfessionalPhoto(formData);
    } catch (error) {
      redirect(
        error instanceof Error && error.message === "invalid-photo"
          ? "/account/edit?status=invalid-photo"
          : "/account/edit?status=photo-error",
      );
    }
  }

  const validatedAvailabilityTime = availabilityTime as WorkerTimeAvailability;
  const validatedAvailabilityDays = availabilityDays as WorkerDayAvailability;
  const validatedExpectedRate = String(expectedRate);
  const updates: Record<string, string | number | boolean | null> = {
    full_name: fullName,
    phone_number: phoneNumber,
    phone_normalized: phoneValidation.normalized,
    whatsapp_number: whatsappNumber || null,
    city_id: city?.id ?? null,
    area: area || null,
    category_id: category?.id ?? null,
    gender,
    age,
    availability: workerAvailabilitySummary(
      validatedAvailabilityTime,
      validatedAvailabilityDays,
    ),
    availability_time: validatedAvailabilityTime,
    availability_days: validatedAvailabilityDays,
    years_experience: yearsExperience,
    experience: experience || null,
    expected_rate: validatedExpectedRate,
    tagline: tagline || defaultWorkerTagline,
    short_bio: shortBio || null,
    cnic: cnic || null,
  };

  if (secretQuestion && secretAnswer) {
    updates.secret_question = secretQuestion;
    updates.secret_answer_hash = await hashSecret(secretAnswer.toLowerCase());
  }

  if (profilePhotoUrl) {
    updates.profile_photo_url = profilePhotoUrl;
  }

  const { error } = await supabase
    .from("professionals")
    .update(updates)
    .eq("id", sessionProfessional.id);

  if (error) {
    console.error("Failed to update professional profile", error);

    if (isDuplicatePhoneDatabaseError(error)) {
      redirect("/account/edit?status=duplicate-phone");
    }

    redirect("/account/edit?status=error");
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/account/edit");
  revalidatePath("/professionals");
  revalidatePath(`/professionals/${sessionProfessional.id}`);

  redirect("/account?status=updated");
}
