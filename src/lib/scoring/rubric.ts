export interface RubricRuleDefinition {
  ruleId: string;
  ruleTitle: string;
  category: "copy" | "visual" | "compliance";
  pipeline: "copy" | "visual";
  weight: number;
  criteria: string;
  isBlocker?: boolean;
}

export const EMAIL_BEST_PRACTICES_RUBRIC: RubricRuleDefinition[] = [
  {
    ruleId: "SUBJECT_LINE_LENGTH",
    ruleTitle: "Subject Line Length & Front-Loaded Value",
    category: "copy",
    pipeline: "copy",
    weight: 10,
    criteria: "Subject line is 20–60 characters with the primary value proposition front-loaded.",
  },
  {
    ruleId: "PREHEADER_SYNERGY",
    ruleTitle: "Pre-Header Synergy",
    category: "copy",
    pipeline: "copy",
    weight: 10,
    criteria: "Pre-header extends and complements the subject line without repeating it verbatim.",
  },
  {
    ruleId: "BRAND_TONE_ALIGNMENT",
    ruleTitle: "Brand Tone & Reading Level",
    category: "copy",
    pipeline: "copy",
    weight: 15,
    criteria: "Body copy matches the brand's target voice adjectives and reading level.",
  },
  {
    ruleId: "FORBIDDEN_WORDS_CHECK",
    ruleTitle: "Forbidden Words & Spam Triggers",
    category: "copy",
    pipeline: "copy",
    weight: 10,
    criteria: "Zero forbidden brand words, clichés, or high-risk spam trigger phrases appear.",
  },
  {
    ruleId: "PRIMARY_CTA_CLARITY",
    ruleTitle: "Clear Primary Call-To-Action",
    category: "copy",
    pipeline: "copy",
    weight: 10,
    criteria: "A single, action-oriented primary CTA is clearly stated with unambiguous next steps.",
  },
  {
    ruleId: "BRAND_COLOR_COMPLIANCE",
    ruleTitle: "Brand Color Palette Compliance",
    category: "visual",
    pipeline: "visual",
    weight: 10,
    criteria: "Dominant colors and CTA button styling match approved primary/secondary brand hex codes.",
  },
  {
    ruleId: "CTA_ABOVE_FOLD",
    ruleTitle: "Primary CTA Above the Fold",
    category: "visual",
    pipeline: "visual",
    weight: 10,
    criteria: "The primary CTA button is clearly visible within the top 600px viewport.",
  },
  {
    ruleId: "VISUAL_CONTRAST_HIERARCHY",
    ruleTitle: "Visual Hierarchy & Accessibility Contrast",
    category: "visual",
    pipeline: "visual",
    weight: 10,
    criteria: "Typography, button contrast, and logo placement follow accessibility and brand rules.",
  },
  {
    ruleId: "IMAGE_TO_TEXT_RATIO",
    ruleTitle: "Balanced Image-to-Text Ratio",
    category: "visual",
    pipeline: "visual",
    weight: 5,
    criteria: "Layout avoids image-only email traps and maintains a healthy text-to-image balance.",
  },
  {
    ruleId: "MANDATORY_LEGAL_FOOTER",
    ruleTitle: "Mandatory Legal & Unsubscribe Compliance",
    category: "compliance",
    pipeline: "copy",
    weight: 10,
    criteria: "Required legal disclaimers, physical address, and unsubscribe language are present.",
    isBlocker: true,
  },
];
