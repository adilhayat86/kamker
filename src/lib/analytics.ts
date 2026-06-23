import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type TrackEventInput = {
  eventType:
    | "search"
    | "view"
    | "worker_registration"
    | "company_staff_registration"
    | "requirement_submission"
    | "call_click"
    | "whatsapp_click"
    | "requirement_match"
    | "broadcast_sent"
    | "register_click"
    | "registration_form_start"
    | "registration_submit_attempt"
    | "registration_failed"
    | "registration_success";
  targetType:
    | "professional"
    | "company"
    | "company_listing"
    | "customer"
    | "requirement"
    | "page";
  targetId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function trackAnalyticsEvent({
  eventType,
  targetType,
  targetId,
  metadata = {},
}: TrackEventInput) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase.from("analytics_events").insert({
    event_type: eventType,
    target_type: targetType,
    target_id: targetId || null,
    metadata,
  });

  if (error) {
    console.error("Failed to track analytics event", error);
  }
}
