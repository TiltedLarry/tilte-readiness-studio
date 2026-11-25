import { ai, TEXT_AUDIT_MODEL, toGeminiResponseSchema } from "./geminiClient";
import {
  CopyAuditOutputSchema,
  type CopyAuditOutput,
} from "@/lib/schemas/audit.schema";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import { EMAIL_BEST_PRACTICES_RUBRIC } from "@/lib/scoring/rubric";

export async function runCopyAudit(params: {
  subjectLine: string;
  previewText: string;
  bodyCopy: string;
  styleGuide?: StyleGuideProfile | null;
}): Promise<CopyAuditOutput> {
  const copyRules = EMAIL_BEST_PRACTICES_RUBRIC.filter((r) => r.pipeline === "copy");
  const rubricText = copyRules
    .map((r) => `- ${r.ruleId} (${r.ruleTitle}): ${r.criteria}`)
    .join("\n");

  const brandContext = params.styleGuide
    ? `Brand: ${params.styleGuide.brandName}
Tone Adjectives: ${params.styleGuide.toneOfVoice.adjectives.join(", ")}
Reading Level Target: ${params.styleGuide.toneOfVoice.readingLevelTarget}
Forbidden Words: ${params.styleGuide.toneOfVoice.forbiddenWords.join(", ") || "None"}
Compliance Rules: ${params.styleGuide.complianceRules.join("; ") || "Standard CAN-SPAM / GDPR unsubscribe & physical address"}`
    : "No specific brand style guide provided; evaluate against general email best practices and standard legal compliance.";

  const prompt = `
Evaluate this email campaign copy against every copy/compliance rule below.
Return one evaluation object per ruleId with exact ruleId matching, factual finding, exact quote evidence, and concrete suggestedFix (empty string if passed).

Rules to evaluate:
${rubricText}

${brandContext}

Subject Line: ${params.subjectLine}
Preview Text: ${params.previewText || "(empty)"}
Body Copy:
${params.bodyCopy}
`;

  const response = await ai.models.generateContent({
    model: TEXT_AUDIT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: toGeminiResponseSchema(CopyAuditOutputSchema),
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  return CopyAuditOutputSchema.parse(parsed);
}
