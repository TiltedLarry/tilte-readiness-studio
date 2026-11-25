import {
  StyleGuideProfile,
  StyleGuideProfileSchema,
} from "../schemas/styleGuide.schema";
import { ai, TEXT_AUDIT_MODEL, toGeminiResponseSchema } from "./geminiClient";

export async function extractStyleGuideFromFile(
  fileBuffer: Buffer,
  mimeType: string,
  fallbackName: string
): Promise<StyleGuideProfile> {
  const systemInstruction = `
You are a Brand Systems Architect. Extract structured email brand rules from the uploaded style guide document.
If a brand name is not explicitly stated in the text, use "${fallbackName}".
If a specific rule (like reading level or logo placement) is not explicitly mentioned, infer a sensible, standard enterprise email default and state it concisely.
Extract exact hex color codes wherever present.
`;

  const response = await ai.models.generateContent({
    model: TEXT_AUDIT_MODEL,
    contents: [
      {
        inlineData: {
          data: fileBuffer.toString("base64"),
          mimeType,
        },
      },
      "Extract the complete StyleGuideProfile JSON from this brand document.",
    ],
    config: {
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: toGeminiResponseSchema(StyleGuideProfileSchema),
    },
  });

  if (!response.text) {
    throw new Error(`Failed to extract style guide from ${fallbackName}.`);
  }

  return StyleGuideProfileSchema.parse(JSON.parse(response.text));
}
