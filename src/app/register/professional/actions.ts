"use server";

import { redirect } from "next/navigation";

import {
  isWorkerDayAvailability,
  isWorkerTimeAvailability,
  type WorkerDayAvailability,
  type WorkerTimeAvailability,
  workerAvailabilitySummary,
} from "@/lib/worker-availability";
import {
  createProfessionalSession,
  findProfessionalsByPhone,
  hashSecret,
} from "@/lib/auth";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { clearFormDraft, saveFormDraft } from "@/lib/form-draft";
import {
  isLocalDemoStoreEnabled,
  saveLocalProfessional,
} from "@/lib/local-demo-store";
import { normalizePakistanMobilePhone } from "@/lib/phone";
import {
  registrationFailureReasonForErrors,
  trackRegistrationFailure,
  trackRegistrationSubmitAttempt,
  trackRegistrationSuccess,
} from "@/lib/registration-analytics";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { findOrCreateCategoryId, findOrCreateCityId } from "@/lib/taxonomy";
import {
  parseWorkerAge,
  parseWorkerHourlyRate,
} from "@/lib/worker-profile-limits";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isDuplicatePhoneDatabaseError(error: {
  code?: string;
  message?: string;
  details?: string;
} | null | undefined) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();

  return error?.code === "23505" && text.includes("phone_normalized");
}

const defaultWorkerTagline = "Trusted local worker";

async function saveProfessionalDraft(input: {
  fullName: string;
  phoneNumber: string;
  cityName: string;
  categoryName: string;
  gender: string;
  age: number | null;
  availabilityTime: string;
  availabilityDays: string;
  expectedRate: string;
  errors?: string[];
}) {
  await saveFormDraft("professional", {
    fullName: input.fullName,
    phone: input.phoneNumber,
    city: input.cityName,
    category: input.categoryName,
    gender: input.gender,
    age: input.age ? String(input.age) : "",
    availabilityTime: input.availabilityTime,
    availabilityDays: input.availabilityDays,
    rate: input.expectedRate,
    errors: input.errors?.join(",") ?? "",
  });
}

export async function registerProfessional(formData: FormData) {
  const fullName = field(formData, "fullName");
  const phoneInput = field(formData, "phone");
  const phoneValidation = normalizePakistanMobilePhone(phoneInput);
  const phoneNumber = phoneValidation.normalized || phoneInput;
  const cityName = field(formData, "city");
  const categoryName = field(formData, "category");
  const gender = field(formData, "gender");
  const age = parseWorkerAge(field(formData, "age"));
  const availabilityTime = field(formData, "availabilityTime");
  const availabilityDays = field(formData, "availabilityDays");
  const expectedRateInput = field(formData, "rate");
  const expectedRate = parseWorkerHourlyRate(expectedRateInput);
  const password = field(formData, "password");
  const source = field(formData, "source") || "unknown";
  const draftInput = {
    fullName,
    phoneNumber,
    cityName,
    categoryName,
    gender,
    age,
    availabilityTime,
    availabilityDays,
    expectedRate: expectedRateInput,
  };

  await trackRegistrationSubmitAttempt(formData, "professional", "/register/professional", {
    category: categoryName,
    city: cityName,
  });

  const errors = [
    !fullName ? "fullName" : null,
    !phoneInput ? "phone" : null,
    phoneInput && !phoneValidation.ok ? "phoneInvalid" : null,
    !cityName ? "city" : null,
    !categoryName ? "category" : null,
    !gender ? "gender" : null,
    age === null ? "age" : null,
    !isWorkerTimeAvailability(availabilityTime) ? "availabilityTime" : null,
    !isWorkerDayAvailability(availabilityDays) ? "availabilityDays" : null,
    expectedRate === null ? "rate" : null,
    !password ? "password" : null,
  ].filter((error): error is string => Boolean(error));

  if (errors.length > 0) {
    await trackRegistrationFailure(
      formData,
      "professional",
      "/register/professional",
      registrationFailureReasonForErrors(errors),
      errors,
      { category: categoryName, city: cityName },
    );
    await saveProfessionalDraft({ ...draftInput, errors });
    redirect("/register/professional?status=missing");
  }

  const duplicateProfessionals = await findProfessionalsByPhone(
    phoneValidation.normalized,
  );

  if (duplicateProfessionals.length > 0) {
    await trackRegistrationFailure(
      formData,
      "professional",
      "/register/professional",
      "duplicate_phone",
      ["phoneDuplicate"],
      { category: categoryName, city: cityName },
    );
    await saveProfessionalDraft({ ...draftInput, errors: ["phoneDuplicate"] });
    redirect("/register/professional?status=missing");
  }

  const validatedAge = age as number;
  const validatedAvailabilityTime = availabilityTime as WorkerTimeAvailability;
  const validatedAvailabilityDays = availabilityDays as WorkerDayAvailability;
  const validatedExpectedRate = String(expectedRate);

  const passwordHash = await hashSecret(password);

  if (!isSupabaseConfigured || !supabase) {
    if (isLocalDemoStoreEnabled) {
      const professional = await saveLocalProfessional({
        fullName,
        phoneNumber,
        whatsappNumber: "",
        cityName,
        area: "",
        categoryName,
        gender,
        age: validatedAge,
        availabilityTime: validatedAvailabilityTime,
        availabilityDays: validatedAvailabilityDays,
        yearsExperience: 0,
        experience: "",
        expectedRate: validatedExpectedRate,
        tagline: defaultWorkerTagline,
        shortBio: "",
        passwordHash,
        secretQuestion: null,
        secretAnswerHash: null,
      });
      await clearFormDraft("professional");
      if (professional) {
        await createProfessionalSession(professional.id);
        await trackRegistrationSuccess(
          formData,
          "professional",
          "/register/professional",
          professional.id,
          "professional",
          { category: categoryName, city: cityName, local_demo: true },
        );
      }
      redirect("/account?status=registered");
    }

    await trackRegistrationFailure(
      formData,
      "professional",
      "/register/professional",
      "not_configured",
      ["notConfigured"],
      { category: categoryName, city: cityName },
    );
    await saveProfessionalDraft(draftInput);
    redirect("/register/professional?status=not-configured");
  }

  const [cityId, categoryId] = await Promise.all([
    findOrCreateCityId(cityName),
    findOrCreateCategoryId(categoryName),
  ]);

  const availability = workerAvailabilitySummary(
    validatedAvailabilityTime,
    validatedAvailabilityDays,
  );

  const insertPayload = {
    full_name: fullName,
    phone_number: phoneNumber,
    phone_normalized: phoneValidation.normalized,
    whatsapp_number: null,
    city_id: cityId,
    area: null,
    category_id: categoryId,
    gender,
    age: validatedAge,
    availability,
    availability_time: validatedAvailabilityTime,
    availability_days: validatedAvailabilityDays,
    years_experience: 0,
    experience: null,
    expected_rate: validatedExpectedRate,
    tagline: defaultWorkerTagline,
    short_bio: null,
    cnic: null,
    profile_photo_url: null,
    password_hash: passwordHash,
    secret_question: null,
    secret_answer_hash: null,
    is_phone_verified: false,
    is_cnic_verified: false,
    is_active: true,
    is_banned: false,
  };

  let { data: professional, error } = await supabase
    .from("professionals")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error?.code === "PGRST204") {
    const legacyInsertPayload = Object.fromEntries(
      Object.entries(insertPayload).filter(([key]) => key !== "is_banned"),
    );
    const fallbackInsert = await supabase
      .from("professionals")
      .insert(legacyInsertPayload)
      .select("id")
      .single();

    professional = fallbackInsert.data;
    error = fallbackInsert.error;
  }

  if (error || !professional) {
    console.error("Failed to register professional", error);

    if (isDuplicatePhoneDatabaseError(error)) {
      await trackRegistrationFailure(
        formData,
        "professional",
        "/register/professional",
        "duplicate_phone",
        ["phoneDuplicate"],
        { category: categoryName, city: cityName },
      );
      await saveProfessionalDraft({ ...draftInput, errors: ["phoneDuplicate"] });
      redirect("/register/professional?status=missing");
    }

    await trackRegistrationFailure(
      formData,
      "professional",
      "/register/professional",
      "database_insert",
      [error?.code ?? "databaseInsert"],
      { category: categoryName, city: cityName },
    );
    await saveProfessionalDraft(draftInput);
    redirect("/register/professional?status=error");
  }

  await trackRegistrationSuccess(
    formData,
    "professional",
    "/register/professional",
    professional.id as string,
    "professional",
    { category: categoryName, city: cityName, auto_approved: true },
  );

  await trackAnalyticsEvent({
    eventType: "worker_registration",
    targetType: "professional",
    targetId: professional.id as string,
    metadata: {
      category: categoryName,
      city: cityName,
      source,
      path: "/register/professional",
    },
  });

  await createProfessionalSession(professional.id as string);
  await clearFormDraft("professional");
  redirect("/account?status=registered");
}
