import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { whatsappDigits } from "@/lib/phone";

type SendWhatsappTextInput = {
  to: string;
  body: string;
  relatedType?: string;
  relatedId?: string;
};

type SendWhatsappTemplateInput = SendWhatsappTextInput & {
  templateName: string;
  languageCode: string;
};

function cleanPhoneNumber(value: string) {
  return whatsappDigits(value);
}

function whatsappConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v20.0",
    adminAlertTemplateName:
      process.env.WHATSAPP_ADMIN_ALERT_TEMPLATE_NAME || "kamker_admin_alerts",
    adminAlertTemplateLanguage:
      process.env.WHATSAPP_ADMIN_ALERT_TEMPLATE_LANGUAGE || "en",
    requirementTemplateName:
      process.env.WHATSAPP_REQUIREMENT_TEMPLATE_NAME || "kamker_requirement_broadcast",
    requirementTemplateLanguage:
      process.env.WHATSAPP_REQUIREMENT_TEMPLATE_LANGUAGE || "en",
  };
}

async function logWhatsappMessage(input: {
  recipientPhone: string;
  body: string;
  messageType?: "text" | "template";
  status: "pending" | "sent" | "failed" | "skipped";
  providerMessageId?: string | null;
  errorMessage?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
}) {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase.from("whatsapp_messages").insert({
    recipient_phone: input.recipientPhone,
    message_type: input.messageType ?? "text",
    body: input.body,
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    error_message: input.errorMessage ?? null,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    request_payload: input.requestPayload ?? null,
    response_payload: input.responsePayload ?? null,
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
  });

  if (error) {
    console.error("Failed to log WhatsApp message", error);
  }
}

export function isWhatsappConfigured() {
  const config = whatsappConfig();

  return Boolean(config.accessToken && config.phoneNumberId);
}

export async function sendWhatsappText({
  to,
  body,
  relatedType,
  relatedId,
}: SendWhatsappTextInput) {
  const config = whatsappConfig();
  const recipientPhone = cleanPhoneNumber(to);

  if (!recipientPhone || !body.trim()) {
    return { ok: false, error: "Missing recipient or message body." };
  }

  if (!config.accessToken || !config.phoneNumberId) {
    await logWhatsappMessage({
      recipientPhone,
      body,
      status: "skipped",
      errorMessage: "WhatsApp API is not configured.",
      relatedType,
      relatedId,
    });

    return { ok: false, error: "WhatsApp API is not configured." };
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientPhone,
    type: "text",
    text: {
      preview_url: false,
      body,
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const responsePayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const providerMessageId =
    Array.isArray(responsePayload?.messages) &&
    typeof responsePayload.messages[0]?.id === "string"
      ? responsePayload.messages[0].id
      : null;

  if (!response.ok) {
    const errorMessage = JSON.stringify(responsePayload ?? { status: response.status });

    await logWhatsappMessage({
      recipientPhone,
      body,
      status: "failed",
      errorMessage,
      relatedType,
      relatedId,
      requestPayload: payload,
      responsePayload,
    });

    return { ok: false, error: errorMessage };
  }

  await logWhatsappMessage({
    recipientPhone,
    body,
    status: "sent",
    providerMessageId,
    relatedType,
    relatedId,
    requestPayload: payload,
    responsePayload,
  });

  return { ok: true, providerMessageId };
}

export async function sendWhatsappTemplate({
  to,
  body,
  templateName,
  languageCode,
  relatedType,
  relatedId,
}: SendWhatsappTemplateInput) {
  const config = whatsappConfig();
  const recipientPhone = cleanPhoneNumber(to);
  const cleanBody = body.trim();

  if (!recipientPhone || !cleanBody || !templateName || !languageCode) {
    return { ok: false, error: "Missing recipient, template, language, or message body." };
  }

  if (!config.accessToken || !config.phoneNumberId) {
    await logWhatsappMessage({
      recipientPhone,
      body: cleanBody,
      messageType: "template",
      status: "skipped",
      errorMessage: "WhatsApp API is not configured.",
      relatedType,
      relatedId,
    });

    return { ok: false, error: "WhatsApp API is not configured." };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: cleanBody,
            },
          ],
        },
      ],
    },
  };

  const response = await fetch(
    `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const responsePayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const providerMessageId =
    Array.isArray(responsePayload?.messages) &&
    typeof responsePayload.messages[0]?.id === "string"
      ? responsePayload.messages[0].id
      : null;

  if (!response.ok) {
    const errorMessage = JSON.stringify(responsePayload ?? { status: response.status });

    await logWhatsappMessage({
      recipientPhone,
      body: cleanBody,
      messageType: "template",
      status: "failed",
      errorMessage,
      relatedType,
      relatedId,
      requestPayload: payload,
      responsePayload,
    });

    return { ok: false, error: errorMessage };
  }

  await logWhatsappMessage({
    recipientPhone,
    body: cleanBody,
    messageType: "template",
    status: "sent",
    providerMessageId,
    relatedType,
    relatedId,
    requestPayload: payload,
    responsePayload,
  });

  return { ok: true, providerMessageId };
}

export async function sendAdminWhatsappAlert(body: string, relatedType?: string, relatedId?: string) {
  const adminPhone = process.env.KAMKER_ADMIN_WHATSAPP;
  const config = whatsappConfig();

  if (!adminPhone) {
    console.info("Skipping WhatsApp admin alert because KAMKER_ADMIN_WHATSAPP is not configured.");
    return { ok: false, error: "KAMKER_ADMIN_WHATSAPP is not configured." };
  }

  try {
    if (config.adminAlertTemplateName) {
      const templateResult = await sendWhatsappTemplate({
        to: adminPhone,
        body,
        templateName: config.adminAlertTemplateName,
        languageCode: config.adminAlertTemplateLanguage,
        relatedType,
        relatedId,
      });

      if (templateResult.ok) {
        return templateResult;
      }

      console.warn(
        "WhatsApp admin template alert failed; trying text fallback.",
      );
    }

    return await sendWhatsappText({
      to: adminPhone,
      body,
      relatedType,
      relatedId,
    });
  } catch (error) {
    console.error("Failed to send WhatsApp admin alert", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown WhatsApp alert error.",
    };
  }
}

export async function sendRequirementWhatsappAlert(
  to: string,
  body: string,
  relatedId?: string,
) {
  const config = whatsappConfig();
  const templateBody = body.replace(/\s+/g, " ").trim();

  try {
    if (config.requirementTemplateName) {
      const templateResult = await sendWhatsappTemplate({
        to,
        body: templateBody,
        templateName: config.requirementTemplateName,
        languageCode: config.requirementTemplateLanguage,
        relatedType: "requirement_broadcast",
        relatedId,
      });

      if (templateResult.ok) {
        return templateResult;
      }

      console.warn("WhatsApp requirement template failed; trying text fallback.");
    }

    return await sendWhatsappText({
      to,
      body: `New paid Kamker requirement:\n${body}\nReply directly if you are available.`,
      relatedType: "requirement_broadcast",
      relatedId,
    });
  } catch (error) {
    console.error("Failed to send WhatsApp requirement alert", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown WhatsApp requirement error.",
    };
  }
}
