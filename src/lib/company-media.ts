import { uploadPublicMediaToCloudinary } from "@/lib/cloudinary";

const MAX_COMPANY_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
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

export async function uploadCompanyStaffPhoto(
  formData: FormData,
  companyId: string,
) {
  return uploadCompanyMediaFile(formData, {
    companyId,
    fieldName: "photo",
    folder: "staff",
    imageOnly: true,
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

  const uploaded = await uploadPublicMediaToCloudinary({
    file: value,
    folder: `companies/${options.companyId}/${options.folder}`,
    resourceType: isVideo ? "video" : "image",
    tags: ["company-media", options.folder],
  });

  if (!uploaded) {
    return null;
  }

  return {
    publicUrl: uploaded.secureUrl,
    mediaType: (isVideo ? "video" : "image") as CompanyMediaType,
  };
}
