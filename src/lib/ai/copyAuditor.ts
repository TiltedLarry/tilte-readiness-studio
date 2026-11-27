import {
  FALLBACK_TEXT_MODEL,
  generateWithFallback,
  PRIMARY_TEXT_MODEL,
  toGeminiResponseSchema,
} from "./geminiClient";
import {
  CopyAuditOutputSchema,
  type CopyAuditOutput,
} from "@/lib/schemas/audit.schema";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import {
  EMAIL_BEST_PRACTICES_RUBRIC,
  type RubricRuleDefinition,
} from "@/lib/scoring/rubric";
import {
  ANTI_INJECTION_SYSTEM_POLICY,
  wrapUntrustedData,
} from "@/lib/security/promptGuard";

export async function runCopyAudit(params: {
  subjectLine: string;
  previewText: string;
  bodyCopy: string;
  styleGuide?: StyleGuideProfile | null;
  rubric?: RubricRuleDefinition[];
}): Promise<CopyAuditOutput> {
  const activeRubric = (params.rubric ?? EMAIL_BEST_PRACTICES_RUBRIC).filter(
    (r) => r.enabled !== false && r.pipeline === "copy"
  );
  const rubricText = activeRubric
    .map((r) => `- ${r.ruleId} (${r.ruleTitle}): ${r.criteria}`)
    .join("\n");

  const brandContext = params.styleGuide
    ? `Brand: ${params.styleGuide.brandName}
Tone Adjectives: ${params.styleGuide.toneAndCompliance.toneAdjectives.join(", ")}
Forbidden Words: ${params.styleGuide.toneAndCompliance.forbiddenWords.join(", ") || "None"}
Mandatory Footer: ${params.styleGuide.toneAndCompliance.mandatoryFooter || "Standard CAN-SPAM / GDPR unsubscribe & physical address"}`
    : "No specific brand style guide provided; evaluate against general email best practices and standard legal compliance.";

  const prompt = `
Audit the following untrusted email campaign data strictly against the rubric below.
Return one evaluation object per ruleId with exact ruleId matching, factual finding, exact quote evidence, and concrete suggestedFix (empty string if passed).

Rules to evaluate:
${rubricText}

${brandContext}

${wrapUntrustedData("subject_line", params.subjectLine)}
${wrapUntrustedData("preview_text", params.previewText || "(empty)")}
${wrapUntrustedData("email_body_copy", params.bodyCopy)}
`;

  const response = await generateWithFallback(
    {
      contents: prompt,
      config: {
        systemInstruction: ANTI_INJECTION_SYSTEM_POLICY,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: toGeminiResponseSchema(CopyAuditOutputSchema),
      },
    },
    PRIMARY_TEXT_MODEL,
    FALLBACK_TEXT_MODEL
  );

  const parsed = JSON.parse(response.text ?? "{}");
  return CopyAuditOutputSchema.parse(parsed);
}
