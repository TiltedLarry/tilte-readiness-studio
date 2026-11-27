import {
  FALLBACK_TEXT_MODEL,
  generateWithFallback,
  PRIMARY_TEXT_MODEL,
  toGeminiResponseSchema,
} from "./geminiClient";
import {
  InboxSimulationOutputSchema,
  type InboxSimulationOutput,
} from "@/lib/schemas/audit.schema";
import {
  ANTI_INJECTION_SYSTEM_POLICY,
  wrapUntrustedData,
} from "@/lib/security/promptGuard";

export async function runInboxSimulation(
  subjectLine: string,
  previewText: string,
  bodyCopy: string
): Promise<InboxSimulationOutput> {
  const prompt = `
Simulate how modern AI email clients (Apple Mail / Gmail) preview and summarize this untrusted email:
- appleMailAiSummary: Realistic 2-line AI preview summary (max 140 characters).
- mobileSubjectTruncated: Exact rendering of the subject line cut off at 35 characters (with "..." if truncated).
- desktopSubjectTruncated: Exact rendering of the subject line cut off at 60 characters (with "..." if truncated).
- summarySentiment: "compelling" | "neutral" | "misleading" | "spammy".
- summaryCritique: 1-2 sentences evaluating whether the AI summary preserves the email's main value proposition.

${wrapUntrustedData("subject_line", subjectLine)}
${wrapUntrustedData("preview_text", previewText || "(empty)")}
${wrapUntrustedData("email_body_copy", bodyCopy)}
`;

  const response = await generateWithFallback(
    {
      contents: prompt,
      config: {
        systemInstruction: ANTI_INJECTION_SYSTEM_POLICY,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: toGeminiResponseSchema(InboxSimulationOutputSchema),
      },
    },
    PRIMARY_TEXT_MODEL,
    FALLBACK_TEXT_MODEL
  );

  const parsed = JSON.parse(response.text ?? "{}");
  if (
    typeof parsed.appleMailAiSummary === "string" &&
    parsed.appleMailAiSummary.length > 140
  ) {
    parsed.appleMailAiSummary = parsed.appleMailAiSummary.slice(0, 137) + "...";
  }
  return InboxSimulationOutputSchema.parse(parsed);
}
