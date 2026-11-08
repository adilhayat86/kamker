import "server-only";
import { verifiedPhotoUrl } from "@/lib/photo-asset";
import { supabase } from "@/lib/supabase";
import { trackAnalyticsEvent } from "@/lib/analytics";

export async function verifyPhotoIntent(id: string, ownerId: string, folder: string) {
  if (!supabase || !/^[a-f0-9-]{36}$/.test(id)) throw new Error("invalid-photo");
  const { data: intent, error } = await supabase.from("media_upload_intents")
    .select("id, public_id, created_at, expires_at")
    .eq("id", id).eq("owner_id", ownerId).eq("folder", folder)
    .gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error || !intent) throw new Error("invalid-photo");
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("photo-unavailable");
  const response = await fetch(
    "https://api.cloudinary.com/v1_1/" + encodeURIComponent(cloud) + "/resources/image/upload/" + encodeURIComponent(intent.public_id), {
    headers: { Authorization: "Basic " + Buffer.from(key + ":" + secret).toString("base64") }, cache: "no-store",
  });
  if (!response.ok) throw new Error("photo-unavailable");
  const asset = await response.json();
  const url = verifiedPhotoUrl(asset, intent, cloud);
  return { url, id };
}

export async function recordPhotoAttachment(id: string, ownerId: string, targetType: "professional" | "customer" | "page" = "professional") {
  if (!supabase) return;
  const { data } = await supabase.from("media_upload_intents").update({ attached_at: new Date().toISOString() })
    .eq("id", id).eq("owner_id", ownerId).is("attached_at", null).select("id");
  if (data?.length) await trackAnalyticsEvent({ eventType: "photo_attached", targetType, targetId: ownerId });
}
