import { hasSameOrigin } from "@/lib/request-origin";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPhotoActor } from "@/lib/photo-actor";
import { canManageCompany } from "@/lib/ownership";
import { getCloudinaryUploadSignature } from "@/lib/cloudinary";
import { supabase } from "@/lib/supabase";
import { trackAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const folder = payload?.folder;
  if (!supabase) return NextResponse.json({ error: "Uploads unavailable" }, { status: 503 });
  if (folder !== "professional-photos" && folder !== "company-staff") return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  const owner = await getPhotoActor(folder);
  if (!owner) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (folder === "company-staff" && (typeof payload.companyId !== "string" || !(await canManageCompany(payload.companyId)))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const id = randomUUID();
  const signature = getCloudinaryUploadSignature({ folder: folder + "/" + owner.id, publicId: id, convertPhoto: true });
  if (!signature) return NextResponse.json({ error: "Uploads unavailable" }, { status: 503 });
  const { error } = await supabase.rpc("reserve_photo_upload", {
    p_id: id, p_owner: owner.id, p_folder: folder,
    p_public_id: signature.folder + "/" + id,
  });
  if (error) return NextResponse.json({ error: error.code === "P0001" ? "Try again in an hour" : "Uploads unavailable" }, { status: error.code === "P0001" ? 429 : 503 });
  await trackAnalyticsEvent({ eventType: "photo_upload_attempt", targetType: owner.targetType, targetId: owner.id });
  return NextResponse.json({ ...signature, intentId: id }, { headers: { "Cache-Control": "no-store" } });
}
