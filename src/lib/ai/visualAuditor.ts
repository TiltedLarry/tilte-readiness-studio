import { ai, VISUAL_AUDIT_MODEL, toGeminiResponseSchema } from "./geminiClient";
import {
  VisualAuditOutputSchema,
  type VisualAuditOutput,
} from "@/lib/schemas/audit.schema";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import { EMAIL_BEST_PRACTICES_RUBRIC } from "@/lib/scoring/rubric";

export async function runVisualAudit(params: {
  imageBase64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  styleGuide?: StyleGuideProfile | null;
}): Promise<VisualAuditOutput> {
  const visualRules = EMAIL_BEST_PRACTICES_RUBRIC.filter((r) => r.pipeline === "visual");
  const rubricText = visualRules
    .map((r) => `- ${r.ruleId} (${r.ruleTitle}): ${r.criteria}`)
    .join("\n");

  const rulesContext = params.styleGuide
    ? `Brand: ${params.styleGuide.brandName}
Primary Hex Colors: ${params.styleGuide.visualIdentity.primaryHexColors.join(", ")}
Secondary Hex Colors: ${params.styleGuide.visualIdentity.secondaryHexColors.join(", ")}
CTA Button Style: ${params.styleGuide.visualIdentity.ctaButtonStyle}
Logo Placement Rules: ${params.styleGuide.visualIdentity.logoPlacementRules}`
    : "No brand rules attached; assess general visual hierarchy, CTA prominence, and contrast.";

  const response = await ai.models.generateContent({
    model: VISUAL_AUDIT_MODEL,
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
  });

  const parsed = JSON.parse(response.text ?? "{}");
  return VisualAuditOutputSchema.parse(parsed);
}
