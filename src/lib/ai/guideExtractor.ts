import {
  StyleGuideProfile,
  StyleGuideProfileSchema,
} from "../schemas/styleGuide.schema";
import {
  FALLBACK_TEXT_MODEL,
  generateWithFallback,
  PRIMARY_TEXT_MODEL,
  toGeminiResponseSchema,
} from "./geminiClient";

export async function extractStyleGuideFromFile(
  fileBuffer: Buffer,
  mimeType: string,
  fallbackName: string
): Promise<StyleGuideProfile> {
  const response = await generateWithFallback(
    {
      contents: [
        {
          inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType,
          },
        },
        `Extract the Corporate CI rules for "${fallbackName}" from this document.
CRITICAL INSTRUCTIONS:
1. brandName: Use the official brand/sub-brand name found in the document (or "${fallbackName}" if unclear).
2. colors: Extract exact hex codes. If colors are only named (e.g., "Nedbank Green", "Contrast Green", "Soft White"), include the name and its standard hex equivalent (e.g., "Nedbank Green (#006341)").
3. logoRules & imageGuidance: Summarize layout construction, background rules, gradients, and imagery rules concisely (1-2 sentences each).
4. toneAndCompliance: Extract tone adjectives, banned words, and legal footer rules (or sensible corporate defaults if this is a visual-only page).`,
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: toGeminiResponseSchema(StyleGuideProfileSchema),
      },
    },
    PRIMARY_TEXT_MODEL,
    FALLBACK_TEXT_MODEL
  );

  if (!response.text) {
    throw new Error(`No rules could be extracted from ${fallbackName}.`);
  }

  return StyleGuideProfileSchema.parse(JSON.parse(response.text));
}
