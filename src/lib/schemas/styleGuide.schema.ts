import { z } from "zod";

export const StyleGuideProfileSchema = z.object({
  id: z.string().uuid().optional(),
  brandName: z.string().min(1),
  colors: z.object({
    primaryHex: z
      .array(z.string())
      .describe("Primary brand hex codes, e.g., ['#004B87']"),
    secondaryHex: z.array(z.string()).describe("Secondary/accent hex codes"),
    ctaButtonRule: z
      .string()
      .describe("Approved CTA button fill and text color rule"),
  }),
  logoRules: z
    .string()
    .describe("Header/footer placement, clear space, and background contrast rules"),
  imageGuidance: z
    .string()
    .describe("Photography style, illustration rules, and image-to-text balance"),
  toneAndCompliance: z.object({
    toneAdjectives: z.array(z.string()).describe("3-4 brand voice adjectives"),
    forbiddenWords: z.array(z.string()).describe("Banned phrases or jargon"),
    mandatoryFooter: z
      .string()
      .describe("Required legal disclaimer or unsubscribe rule"),
  }),
});

export type StyleGuideProfile = z.infer<typeof StyleGuideProfileSchema>;
