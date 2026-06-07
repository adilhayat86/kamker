import { randomUUID } from "node:crypto";

import { supabase } from "@/lib/supabase";

const PHOTO_BUCKET = "professional-photos";
const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export function fallbackProfessionalImage() {
  return "/kamker-professionals.png";
}

export async function uploadProfessionalPhoto(
  formData: FormData,
  fieldName = "photo",
) {
  if (!supabase) {
    return null;
  }

  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const extension = ALLOWED_PHOTO_TYPES.get(value.type);

  if (!extension || value.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("invalid-photo");
  }

  const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, value, {
      cacheControl: "31536000",
      contentType: value.type,
      upsert: false,
    });

  if (error) {
    console.error("Failed to upload professional photo", error);
    throw new Error("photo-upload-error");
  }

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}
