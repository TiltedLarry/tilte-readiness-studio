import { z } from "zod";
import {
  CopyAuditOutputSchema,
  InboxSimulationOutputSchema,
  VisualAuditOutputSchema,
} from "../schemas/audit.schema";
import { StyleGuideProfile } from "../schemas/styleGuide.schema";
import {
  EMAIL_BEST_PRACTICES_RUBRIC,
  type RubricRuleDefinition,
} from "../scoring/rubric";
import {
  ANTI_INJECTION_SYSTEM_POLICY,
  wrapUntrustedData,
} from "../security/promptGuard";
import {
  generateWithFallback,
  PRIMARY_VISUAL_MODEL,
  toGeminiResponseSchema,
} from "./geminiClient";

const UnifiedAuditSchema = z.object({
  copy: CopyAuditOutputSchema,
  inbox: InboxSimulationOutputSchema,
  visual: VisualAuditOutputSchema,
});

export async function runUnifiedCampaignAudit({
  subjectLine,
  previewText,
  bodyCopy,
  imageBase64,
  mimeType,
  styleGuide,
  rubric,
}: {
  subjectLine: string;
  previewText: string;
  bodyCopy: string;
  imageBase64: string;
  mimeType: string;
  styleGuide: StyleGuideProfile;
  rubric?: RubricRuleDefinition[];
}) {
  const activeRules = (rubric ?? EMAIL_BEST_PRACTICES_RUBRIC).filter(
    (r) => r.enabled !== false
  );

  const systemInstruction = `
You are the Email Campaign Readiness Studio Auditor.
Perform three checks in one pass and return strictly valid JSON:
1. "copy": Grade all copy & compliance rubric rules against the email text and Corporate CI. Return one evaluation per copy/compliance ruleId.
2. "inbox": Simulate Apple Mail / Gmail AI summary (max 140 chars), critique it, and truncate subject line at 35 chars (mobile) and 60 chars (desktop).
3. "visual": Inspect the attached Figma PNG against all visual rubric rules and Corporate CI colors, logo rules, and imagery guidance. Return one evaluation per visual ruleId.

CORPORATE CI (${styleGuide.brandName}):
- Primary Colors: ${styleGuide.colors.primaryHex.join(", ")}
- Secondary Colors: ${styleGuide.colors.secondaryHex.join(", ") || "None"}
- CTA Rule: ${styleGuide.colors.ctaButtonRule}
- Logo Rules: ${styleGuide.logoRules}
- Image Guidance: ${styleGuide.imageGuidance}
- Tone: ${styleGuide.toneAndCompliance.toneAdjectives.join(", ")}
- Forbidden Words: ${styleGuide.toneAndCompliance.forbiddenWords.join(", ") || "None"}
- Mandatory Footer: ${styleGuide.toneAndCompliance.mandatoryFooter}

RUBRIC RULES:
${activeRules
  .map(
    (r) =>
      `- [${r.ruleId}] (${r.category.toUpperCase()} - ${r.ruleTitle}): ${r.criteria}`
  )
  .join("\n")}

${ANTI_INJECTION_SYSTEM_POLICY}
`;

  const response = await generateWithFallback(
    {
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        },
        `Audit this campaign:
${wrapUntrustedData("subject_line", subjectLine)}
${wrapUntrustedData("preview_text", previewText || "(empty)")}
${wrapUntrustedData("email_body_copy", bodyCopy)}`,
      ],
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: toGeminiResponseSchema(UnifiedAuditSchema),
      },
    },
    PRIMARY_VISUAL_MODEL
  );

  if (!response.text) {
    throw new Error("Empty response from audit engine.");
  }

  const parsed = JSON.parse(response.text);
  if (
    typeof parsed?.inbox?.appleMailAiSummary === "string" &&
    parsed.inbox.appleMailAiSummary.length > 140
  ) {
    parsed.inbox.appleMailAiSummary =
      parsed.inbox.appleMailAiSummary.slice(0, 137) + "...";
  }

  return UnifiedAuditSchema.parse(parsed);
}
