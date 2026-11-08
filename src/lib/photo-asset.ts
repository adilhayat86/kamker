type PhotoIntent = { public_id: string; created_at: string; expires_at: string };

export function verifiedPhotoUrl(value: unknown, intent: PhotoIntent, cloud: string) {
  if (!value || typeof value !== "object") throw new Error("invalid-photo");
  const asset = value as Record<string, unknown>;
  const created = typeof asset.created_at === "string" ? Date.parse(asset.created_at) : NaN;
  const validSize = typeof asset.bytes === "number" && Number.isInteger(asset.bytes) && asset.bytes > 0 && asset.bytes <= 10 * 1024 * 1024;
  const validDimension = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n > 0;
  if (asset.public_id !== intent.public_id || asset.resource_type !== "image" || asset.type !== "upload" ||
      typeof asset.format !== "string" || !["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(asset.format) ||
      !validSize || !validDimension(asset.width) || !validDimension(asset.height) || !validDimension(asset.version) ||
      !Number.isFinite(created) || created < Date.parse(intent.created_at) - 5000 || created > Date.parse(intent.expires_at) ||
      !/^[a-zA-Z0-9_-]+$/.test(cloud) || !/^kamker\/(professional-photos|company-staff)\/[a-f0-9-]{36}\/[a-f0-9-]{36}$/.test(intent.public_id)) {
    throw new Error("invalid-photo");
  }
  return `https://res.cloudinary.com/${cloud}/image/upload/v${asset.version}/${intent.public_id}.jpg`;
}
