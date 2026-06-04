import { randomUUID } from "node:crypto";

import { supabase } from "@/lib/supabase";

const COMPANY_MEDIA_BUCKET = "company-images";
const MAX_COMPANY_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_COMPANY_VIDEO_SIZE_BYTES = 20 * 1024 * 1024;

const ALLOWED_COMPANY_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const ALLOWED_COMPANY_VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);

export type CompanyMediaType = "image" | "video";

export function companyLogoFallback() {
  return "/kamker-logo.png";
}

export async function uploadCompanyLogo(formData: FormData, companyId: string) {
  return uploadCompanyMediaFile(formData, {
    companyId,
    fieldName: "logo",
    folder: "logos",
    imageOnly: true,
  });
}

export async function uploadCompanyGalleryMedia(
  formData: FormData,
  companyId: string,
) {
  return uploadCompanyMediaFile(formData, {
    companyId,
    fieldName: "media",
    folder: "gallery",
    imageOnly: false,
  });
}

async function uploadCompanyMediaFile(
  formData: FormData,
  options: {
    companyId: string;
    fieldName: string;
    folder: string;
    imageOnly: boolean;
  },
) {
  if (!supabase) {
    return null;
  }

  const value = formData.get(options.fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const imageExtension = ALLOWED_COMPANY_IMAGE_TYPES.get(value.type);
  const videoExtension = options.imageOnly
    ? undefined
    : ALLOWED_COMPANY_VIDEO_TYPES.get(value.type);
  const isImage = Boolean(imageExtension);
  const isVideo = Boolean(videoExtension);
  const extension = imageExtension ?? videoExtension;
  const maxSize = isVideo
    ? MAX_COMPANY_VIDEO_SIZE_BYTES
    : MAX_COMPANY_IMAGE_SIZE_BYTES;

  if (!extension || (!isImage && !isVideo) || value.size > maxSize) {
    throw new Error("invalid-company-media");
  }

  const path = `${options.companyId}/${options.folder}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(COMPANY_MEDIA_BUCKET)
    .upload(path, value, {
      cacheControl: "31536000",
      contentType: value.type,
      upsert: false,
    });

  if (error) {
    console.error("Failed to upload company media", error);
    throw new Error("company-media-upload-error");
  }

  const { data } = supabase.storage.from(COMPANY_MEDIA_BUCKET).getPublicUrl(path);

  return {
    publicUrl: data.publicUrl,
    mediaType: (isVideo ? "video" : "image") as CompanyMediaType,
  };
}
