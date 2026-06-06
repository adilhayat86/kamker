const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendAdminPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
  role: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, reason: "email-not-configured" as const };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.KAMKER_EMAIL_FROM || "Kamker Admin <onboarding@resend.dev>",
      to: [input.to],
      subject: `Kamker ${input.role} admin password reset`,
      html: [
        `<p>A Kamker ${input.role} admin password reset was requested.</p>`,
        `<p><a href="${input.resetUrl}">Confirm password reset</a></p>`,
        "<p>This link expires in 15 minutes. Ignore this email if you did not request it.</p>",
      ].join(""),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to send admin reset email", response.status, errorBody);
    return { ok: false, reason: "email-error" as const };
  }

  return { ok: true as const };
}
