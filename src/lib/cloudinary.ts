import { createHash, randomUUID } from "node:crypto";

type CloudinaryResourceType = "image" | "video" | "auto";

type CloudinaryUploadOptions = {
  file: File;
  folder: string;
  resourceType?: CloudinaryResourceType;
  tags?: string[];
};

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  bytes: number;
};

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

function signCloudinaryParams(params: Record<string, string>) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

export async function uploadPublicMediaToCloudinary({
  file,
  folder,
  resourceType = "auto",
  tags = [],
}: CloudinaryUploadOptions): Promise<CloudinaryUploadResult | null> {
  if (!isCloudinaryConfigured || !cloudName || !apiKey) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = randomUUID();
  const params: Record<string, string> = {
    folder: `kamker/${folder}`,
    public_id: publicId,
    timestamp,
  };

  if (tags.length > 0) {
    params.tags = tags.join(",");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    body.append(key, value);
  }

  body.append("signature", signCloudinaryParams(params));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Cloudinary upload failed", {
      status: response.status,
      body: text.slice(0, 500),
    });
    throw new Error("cloudinary-upload-error");
  }

  const result = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    resource_type?: "image" | "video" | "raw";
    bytes?: number;
  };

  if (!result.secure_url || !result.public_id || !result.resource_type) {
    throw new Error("cloudinary-upload-error");
  }

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes ?? file.size,
  };
}
