import { redirect } from "next/navigation";

import {
  AdminEmptyState,
  AdminMetaGrid,
  AdminSection,
  AdminShell,
  AdminStatCard,
  AdminWarning,
} from "@/components/admin/admin-ui";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "WhatsApp Alerts | Kamker Admin",
};

export const dynamic = "force-dynamic";

type WhatsappMessage = {
  id: string;
  recipient_phone: string;
  message_type: string;
  status: string;
  related_type: string | null;
  related_id: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

async function getWhatsappMessages() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as WhatsappMessage[];
  }

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("id, recipient_phone, message_type, status, related_type, related_id, provider_message_id, error_message, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("Failed to load WhatsApp messages", error);
    return [] as WhatsappMessage[];
  }

  return (data ?? []) as WhatsappMessage[];
}

export default async function AdminWhatsappPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const messages = await getWhatsappMessages();
  const configured =
    Boolean(process.env.WHATSAPP_ACCESS_TOKEN) &&
    Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
    Boolean(process.env.KAMKER_ADMIN_WHATSAPP);
  const sentCount = messages.filter((message) => message.status === "sent").length;
  const failedCount = messages.filter((message) => message.status === "failed").length;

  return (
    <AdminShell
      active="/admin/whatsapp"
      title="WhatsApp Alerts"
      description="Admin-only WhatsApp alert foundation. No mass customer/professional broadcast is enabled here."
    >
      {!configured ? (
        <AdminWarning title="WhatsApp admin alerts need setup">
          Configure WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and KAMKER_ADMIN_WHATSAPP. Secret values are never displayed.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Configured" value={configured ? "Yes" : "No"} tone={configured ? "good" : "warning"} />
        <AdminStatCard label="Sent" value={sentCount} />
        <AdminStatCard label="Failed" value={failedCount} tone={failedCount ? "urgent" : "good"} />
      </div>

      <AdminSection title="Recent WhatsApp Admin Alerts" description="Event-only alerts for registrations, proofs, listings, and requirements.">
        <div className="grid gap-3">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{message.related_type ?? "admin_alert"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(message.created_at).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{message.status}</span>
                </div>
                <div className="mt-4">
                  <AdminMetaGrid
                    items={[
                      { label: "Recipient", value: message.recipient_phone },
                      { label: "Message type", value: message.message_type },
                      { label: "Provider ID", value: message.provider_message_id ?? "Not provided" },
                      { label: "Related ID", value: message.related_id ?? "Not linked" },
                      { label: "Sent at", value: message.sent_at ? new Date(message.sent_at).toLocaleString("en-PK") : "Not sent" },
                      { label: "Error", value: message.error_message ?? "None" },
                    ]}
                  />
                </div>
              </div>
            ))
          ) : (
            <AdminEmptyState>No WhatsApp alert records found.</AdminEmptyState>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
