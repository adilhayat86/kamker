export type AiProofReviewResult = {
  readable: boolean;
  detectedAmountPkr: number | null;
  detectedReference: string | null;
  detectedMethod: string | null;
  detectedDate: string | null;
  confidence: number;
  decision: "auto_approved" | "needs_review";
  notes: string;
};

type ReviewProofInput = {
  imageUrl: string;
  expectedAmountPkr: number;
};

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function canAutoApproveProof(review: AiProofReviewResult, expectedAmountPkr: number) {
  return (
    review.readable &&
    review.decision === "auto_approved" &&
    review.confidence >= Number(process.env.AI_REVIEW_AUTO_APPROVE_CONFIDENCE ?? 0.85) &&
    review.detectedAmountPkr !== null &&
    review.detectedAmountPkr >= expectedAmountPkr &&
    Boolean(review.detectedReference)
  );
}

export async function reviewProofWithAi({
  imageUrl,
  expectedAmountPkr,
}: ReviewProofInput): Promise<AiProofReviewResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AI_REVIEW_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return {
      readable: false,
      detectedAmountPkr: null,
      detectedReference: null,
      detectedMethod: null,
      detectedDate: null,
      confidence: 0,
      decision: "needs_review",
      notes: "OPENAI_API_KEY is not configured.",
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You review Pakistani wallet or bank receipt screenshots for Kamker. Extract only visible facts. Return valid JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Expected amount in PKR is ${expectedAmountPkr}. Return JSON with readable boolean, detectedAmountPkr number or null, detectedReference string or null, detectedMethod string or null, detectedDate string or null, confidence number from 0 to 1, decision auto_approved or needs_review, and notes string. Use auto_approved only when screenshot is readable, amount is at least expected amount, and a transaction/reference number is visible.`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    return {
      readable: false,
      detectedAmountPkr: null,
      detectedReference: null,
      detectedMethod: null,
      detectedDate: null,
      confidence: 0,
      decision: "needs_review",
      notes: `AI review failed with status ${response.status}.`,
    };
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;

  if (typeof rawContent !== "string") {
    return {
      readable: false,
      detectedAmountPkr: null,
      detectedReference: null,
      detectedMethod: null,
      detectedDate: null,
      confidence: 0,
      decision: "needs_review",
      notes: "AI review returned no content.",
    };
  }

  try {
    const parsed = JSON.parse(rawContent) as Record<string, unknown>;
    const confidence = safeNumber(parsed.confidence) ?? 0;
    const detectedAmountPkr = safeNumber(parsed.detectedAmountPkr);
    const detectedReference = safeString(parsed.detectedReference);
    const decision =
      parsed.decision === "auto_approved" &&
      Boolean(parsed.readable) &&
      detectedAmountPkr !== null &&
      detectedAmountPkr >= expectedAmountPkr &&
      detectedReference
        ? "auto_approved"
        : "needs_review";

    return {
      readable: Boolean(parsed.readable),
      detectedAmountPkr,
      detectedReference,
      detectedMethod: safeString(parsed.detectedMethod),
      detectedDate: safeString(parsed.detectedDate),
      confidence,
      decision,
      notes: safeString(parsed.notes) ?? "No notes.",
    };
  } catch (error) {
    console.error("Failed to parse AI proof review", error);
    return {
      readable: false,
      detectedAmountPkr: null,
      detectedReference: null,
      detectedMethod: null,
      detectedDate: null,
      confidence: 0,
      decision: "needs_review",
      notes: "AI review JSON could not be parsed.",
    };
  }
}
