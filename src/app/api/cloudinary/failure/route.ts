import { NextResponse } from "next/server";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { trackAnalyticsEvent } from "@/lib/analytics";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new NextResponse(null, { status: 403 });
  const owner = (await getSessionProfessional()) ?? (await getSessionCustomer());
  if (!owner || !supabase) return new NextResponse(null, { status: 401 });
  const payload = await request.json().catch(() => null);
  if (typeof payload?.id !== "string" || !/^[a-f0-9-]{36}$/.test(payload.id)) return new NextResponse(null, { status: 400 });
  const { data } = await supabase.from("media_upload_intents").update({ failed_at: new Date().toISOString() })
    .eq("id", payload.id).eq("owner_id", owner.id).is("failed_at", null).is("attached_at", null)
    .gt("expires_at", new Date().toISOString()).select("id");
  if (data?.length) await trackAnalyticsEvent({ eventType: "photo_upload_failure", targetType: "professional", targetId: owner.id });
  return NextResponse.json({ ok: true });
}
