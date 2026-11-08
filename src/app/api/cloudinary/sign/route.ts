import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { canManageCompany } from "@/lib/ownership";
import { getCloudinaryUploadSignature } from "@/lib/cloudinary";
import { supabase } from "@/lib/supabase";
import { trackAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const [worker, customer] = await Promise.all([getSessionProfessional(), getSessionCustomer()]);
  const owner = worker ?? customer;
  if (!owner) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const folder = payload?.folder;
  if (!supabase) return NextResponse.json({ error: "Uploads unavailable" }, { status: 503 });
  if (folder !== "professional-photos" && folder !== "company-staff") return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  if ((folder === "professional-photos" && !worker) ||
      (folder === "company-staff" && (typeof payload.companyId !== "string" || !(await canManageCompany(payload.companyId))))) {
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
  await trackAnalyticsEvent({ eventType: "photo_upload_attempt", targetType: "professional", targetId: owner.id });
  return NextResponse.json({ ...signature, intentId: id }, { headers: { "Cache-Control": "no-store" } });
}
