import { z } from "zod";

export const StyleGuideProfileSchema = z.object({
  id: z.string().uuid().optional(),
  brandName: z.string().min(1, "Brand name is required"),
  toneOfVoice: z.object({
    adjectives: z
      .array(z.string())
      .describe("3-5 adjectives defining brand voice, e.g., 'Empathetic, Clear, Authoritative'"),
    forbiddenWords: z.array(z.string()).describe("Jargon, clichés, or banned phrases"),
    readingLevelTarget: z.string().describe("e.g., 'Grade 6-8 (Accessible)'"),
  }),
  visualIdentity: z.object({
    primaryHexColors: z.array(z.string()).describe("Approved primary hex codes, e.g., ['#1A73E8']"),
    secondaryHexColors: z.array(z.string()).describe("Approved accent/background hex codes"),
    ctaButtonStyle: z.string().describe("Rules for primary CTA button color, shape, and contrast"),
    logoPlacementRules: z.string().describe("Where and how the logo must appear in the header/footer"),
  }),
  complianceRules: z
    .array(z.string())
    .describe("Mandatory legal disclaimers, unsubscribe text, or regional requirements"),
});

export type StyleGuideProfile = z.infer<typeof StyleGuideProfileSchema>;
