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
  parameters?: string[];
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
    requirementReportTemplateName:
      process.env.WHATSAPP_REQUIREMENT_REPORT_TEMPLATE_NAME || "kamker_requirement_report",
    requirementReportTemplateLanguage:
      process.env.WHATSAPP_REQUIREMENT_REPORT_TEMPLATE_LANGUAGE || "en",
  };
}

async function logWhatsappMessage(input: {
  recipientPhone: string;
  body: string;
  messageType?: "text" | "template";
  status: "pending" | "sent" | "failed" | "skipped";
  templateName?: string | null;
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
    template_name: input.templateName ?? null,
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

export function isRequirementWhatsappConfigured() {
  const config = whatsappConfig();

  return Boolean(
    config.accessToken &&
      config.phoneNumberId &&
      config.requirementTemplateName &&
      config.requirementTemplateLanguage,
  );
}

export function isRequirementReportWhatsappConfigured() {
  const config = whatsappConfig();

  return Boolean(
    config.accessToken &&
      config.phoneNumberId &&
      config.requirementReportTemplateName &&
      config.requirementReportTemplateLanguage,
  );
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
  parameters,
  relatedType,
  relatedId,
}: SendWhatsappTemplateInput) {
  const config = whatsappConfig();
  const recipientPhone = cleanPhoneNumber(to);
  const cleanBody = body.trim();
  const templateParameters =
    parameters?.map((parameter) => parameter.trim()).filter(Boolean) ?? [
      cleanBody,
    ];

  if (
    !recipientPhone ||
    !cleanBody ||
    !templateName ||
    !languageCode ||
    templateParameters.length === 0
  ) {
    return { ok: false, error: "Missing recipient, template, language, or message body." };
  }

  if (!config.accessToken || !config.phoneNumberId) {
    await logWhatsappMessage({
      recipientPhone,
      body: cleanBody,
      messageType: "template",
      templateName,
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
          parameters: templateParameters.map((text) => ({
            type: "text",
            text,
          })),
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
      templateName,
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
    templateName,
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
  const recipientPhone = cleanPhoneNumber(to);

  try {
    if (
      !recipientPhone ||
      !templateBody ||
      !config.requirementTemplateName ||
      !config.requirementTemplateLanguage
    ) {
      await logWhatsappMessage({
        recipientPhone,
        body: templateBody,
        messageType: "template",
        templateName: config.requirementTemplateName,
        status: "skipped",
        errorMessage: "WhatsApp requirement template is not configured.",
        relatedType: "requirement_broadcast",
        relatedId,
      });

      return {
        ok: false,
        error: "WhatsApp requirement template is not configured.",
      };
    }

    return await sendWhatsappTemplate({
      to,
      body: templateBody,
      templateName: config.requirementTemplateName,
      languageCode: config.requirementTemplateLanguage,
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

export async function sendRequirementReportWhatsappAlert(
  to: string,
  body: string,
  relatedId?: string,
  parameters?: string[],
) {
  const config = whatsappConfig();
  const templateBody = body.replace(/\s+/g, " ").trim();
  const recipientPhone = cleanPhoneNumber(to);

  try {
    if (
      !recipientPhone ||
      !templateBody ||
      !config.requirementReportTemplateName ||
      !config.requirementReportTemplateLanguage
    ) {
      await logWhatsappMessage({
        recipientPhone,
        body: templateBody,
        messageType: "template",
        templateName: config.requirementReportTemplateName,
        status: "skipped",
        errorMessage: "WhatsApp requirement report template is not configured.",
        relatedType: "requirement_sender_update",
        relatedId,
      });

      return {
        ok: false,
        error: "WhatsApp requirement report template is not configured.",
      };
    }

    return await sendWhatsappTemplate({
      to,
      body: templateBody,
      templateName: config.requirementReportTemplateName,
      languageCode: config.requirementReportTemplateLanguage,
      parameters,
      relatedType: "requirement_sender_update",
      relatedId,
    });
  } catch (error) {
    console.error("Failed to send WhatsApp requirement report alert", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown WhatsApp report error.",
    };
  }
}
