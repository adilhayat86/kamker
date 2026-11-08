import { hasSameOrigin } from "@/lib/request-origin";
import { NextResponse } from "next/server";
import { getPhotoActors } from "@/lib/photo-actor";
import { supabase } from "@/lib/supabase";
import { trackAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return new NextResponse(null, { status: 403 });
  const actors = Object.values(await getPhotoActors()).filter(actor => actor !== null);
  if (!actors.length || !supabase) return new NextResponse(null, { status: 401 });
  const payload = await request.json().catch(() => null);
  if (typeof payload?.id !== "string" || !/^[a-f0-9-]{36}$/.test(payload.id)) return new NextResponse(null, { status: 400 });
  const { data: intent } = await supabase.from("media_upload_intents").select("owner_id").eq("id", payload.id).maybeSingle();
  const owner = actors.find(actor => actor.id === intent?.owner_id);
  if (!owner) return new NextResponse(null, { status: 404 });
  const { data } = await supabase.from("media_upload_intents").update({ failed_at: new Date().toISOString() })
    .eq("id", payload.id).eq("owner_id", owner.id).is("failed_at", null).is("attached_at", null)
    .gt("expires_at", new Date().toISOString()).select("id");
  if (data?.length) await trackAnalyticsEvent({ eventType: "photo_upload_failure", targetType: owner.targetType, targetId: owner.id });
  return NextResponse.json({ ok: true });
}
