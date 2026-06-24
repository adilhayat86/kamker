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
import { findOrCreateCategoryId, findOrCreateCityId } from "@/lib/taxonomy";
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

function lastNonEmptyField(formData: FormData, key: string) {
  const values = formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return values.at(-1) ?? "";
}

function numericField(formData: FormData, key: string) {
  const value = Number(field(formData, key));

  return Number.isFinite(value) && value >= 0 ? value : 0;
}

const defaultWorkerTagline = "Trusted local worker";

function redirectWithErrors(status: string, errors: string[]) {
  const query = new URLSearchParams({ status });

  if (errors.length > 0) {
    query.set("fields", errors.join(","));
  }

  redirect(`/account/edit?${query.toString()}`);
}

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
    redirectWithErrors("phone-invalid", ["phoneInvalid"]);
  }

  if (!whatsappValidation.ok) {
    redirectWithErrors("whatsapp-invalid", ["whatsappInvalid"]);
  }

  const errors = [
    !fullName ? "fullName" : null,
    !phoneInput ? "phone" : null,
    !cityName ? "city" : null,
    !categoryName ? "category" : null,
    !gender ? "gender" : null,
    age === null ? "age" : null,
    !isWorkerTimeAvailability(availabilityTime) ? "availabilityTime" : null,
    !isWorkerDayAvailability(availabilityDays) ? "availabilityDays" : null,
    expectedRate === null ? "rate" : null,
    yearsExperience < 0 ? "yearsExperience" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    redirectWithErrors("missing", errors);
  }

  if (tagline && tagline.length > 30) {
    redirectWithErrors("tagline-invalid", ["tagline"]);
  }

  if ((secretQuestion && !secretAnswer) || (!secretQuestion && secretAnswer)) {
    redirectWithErrors("recovery-missing", ["secretQuestion", "secretAnswer"]);
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
    redirectWithErrors("duplicate-phone", ["phoneDuplicate"]);
  }

  const [cityId, categoryId] = await Promise.all([
    findOrCreateCityId(cityName),
    findOrCreateCategoryId(categoryName),
  ]);
  let profilePhotoUrl: string | null =
    lastNonEmptyField(formData, "profilePhotoUrl") || null;

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
    city_id: cityId,
    area: area || null,
    category_id: categoryId,
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
      redirectWithErrors("duplicate-phone", ["phoneDuplicate"]);
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
