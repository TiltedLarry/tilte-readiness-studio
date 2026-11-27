import {
  FALLBACK_VISUAL_MODEL,
  generateWithFallback,
  PRIMARY_VISUAL_MODEL,
  toGeminiResponseSchema,
} from "./geminiClient";
import {
  VisualAuditOutputSchema,
  type VisualAuditOutput,
} from "@/lib/schemas/audit.schema";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import {
  EMAIL_BEST_PRACTICES_RUBRIC,
  type RubricRuleDefinition,
} from "@/lib/scoring/rubric";

export async function runVisualAudit(params: {
  imageBase64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  styleGuide?: StyleGuideProfile | null;
  rubric?: RubricRuleDefinition[];
}): Promise<VisualAuditOutput> {
  const activeRubric = (params.rubric ?? EMAIL_BEST_PRACTICES_RUBRIC).filter(
    (r) => r.enabled !== false && r.pipeline === "visual"
  );
  const rubricText = activeRubric
    .map((r) => `- ${r.ruleId} (${r.ruleTitle}): ${r.criteria}`)
    .join("\n");

  const rulesContext = params.styleGuide
    ? `Brand: ${params.styleGuide.brandName}
Primary Hex Colors: ${params.styleGuide.colors.primaryHex.join(", ")}
Secondary Hex Colors: ${params.styleGuide.colors.secondaryHex.join(", ")}
CTA Button Rule: ${params.styleGuide.colors.ctaButtonRule}
Logo Rules: ${params.styleGuide.logoRules}
Image Guidance: ${params.styleGuide.imageGuidance}`
    : "No brand rules attached; assess general visual hierarchy, CTA prominence, and contrast.";

  const response = await generateWithFallback(
    {
      contents: [
        {
          inlineData: {
            mimeType: params.mimeType,
            data: params.imageBase64,
          },
        },
        `Audit this email design image against the visual rules and brand identity below.
Return one evaluation object per ruleId with exact ruleId matching, factual finding, exact visual location/area evidence, and concrete suggestedFix (empty string if passed).

Rules to evaluate:
${rubricText}

${rulesContext}`,
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: toGeminiResponseSchema(VisualAuditOutputSchema),
      },
    },
    PRIMARY_VISUAL_MODEL,
    FALLBACK_VISUAL_MODEL
  );

  const parsed = JSON.parse(response.text ?? "{}");
  return VisualAuditOutputSchema.parse(parsed);
}
