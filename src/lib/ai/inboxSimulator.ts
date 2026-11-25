import { ai, TEXT_AUDIT_MODEL, toGeminiResponseSchema } from "./geminiClient";
import {
  InboxSimulationOutputSchema,
  type InboxSimulationOutput,
} from "@/lib/schemas/audit.schema";

export async function runInboxSimulation(
  subjectLine: string,
  previewText: string,
  bodyCopy: string
): Promise<InboxSimulationOutput> {
  const prompt = `
Simulate how modern AI email clients (Apple Mail / Gmail) preview and summarize this email:
- appleMailAiSummary: Realistic 2-line AI preview summary (max 140 characters).
- mobileSubjectTruncated: Exact rendering of the subject line cut off at 35 characters (with "..." if truncated).
- desktopSubjectTruncated: Exact rendering of the subject line cut off at 60 characters (with "..." if truncated).
- summarySentiment: "compelling" | "neutral" | "misleading" | "spammy".
- summaryCritique: 1-2 sentences evaluating whether the AI summary preserves the email's main value proposition.

Subject: ${subjectLine}
Preview Text: ${previewText}
Body:
${bodyCopy}
`;

  const response = await ai.models.generateContent({
    model: TEXT_AUDIT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: toGeminiResponseSchema(InboxSimulationOutputSchema),
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  if (typeof parsed.appleMailAiSummary === "string" && parsed.appleMailAiSummary.length > 140) {
    parsed.appleMailAiSummary = parsed.appleMailAiSummary.slice(0, 137) + "...";
  }
  return InboxSimulationOutputSchema.parse(parsed);
}
