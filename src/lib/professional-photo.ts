import { uploadPublicMediaToCloudinary } from "@/lib/cloudinary";

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
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const extension = ALLOWED_PHOTO_TYPES.get(value.type);

  if (!extension || value.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error("invalid-photo");
  }

  const uploaded = await uploadPublicMediaToCloudinary({
    file: value,
    folder: "professional-photos",
    resourceType: "image",
    tags: ["professional-photo"],
  });

  return uploaded?.secureUrl ?? null;
}
