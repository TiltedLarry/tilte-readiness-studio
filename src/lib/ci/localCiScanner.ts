import { extractText, getDocumentProxy } from "unpdf";
import { StyleGuideProfile } from "../schemas/styleGuide.schema";

const NAMED_COLOR_MAP: Record<string, string> = {
  "nedbank green": "Nedbank Green (#006341)",
  "contrast green": "Contrast Green (#008752)",
  "soft white": "Soft White (#F4F6F5)",
  "absa red": "ABSA Red (#DC0032)",
  "sanlam blue": "Sanlam Blue (#0075C9)",
};

export interface LocalScanResult {
  profile: StyleGuideProfile;
  rawText: string;
  needsAiEnrichment: boolean;
}

export async function scanStyleGuideLocally(
  fileBuffer: Buffer,
  mimeType: string,
  fallbackName: string
): Promise<LocalScanResult> {
  let rawText = "";

  if (mimeType === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
    const { text } = await extractText(pdf, { mergePages: true });
    rawText = text || "";
  } else {
    rawText = fileBuffer.toString("utf-8");
  }

  const normalized = rawText.replace(/\s+/g, " ").trim();

  // 1. Deterministic Hex & RGB Color Extraction
  const hexMatches = Array.from(
    new Set(
      (normalized.match(/#[0-9A-Fa-f]{6}\b/g) || []).map((h) => h.toUpperCase())
    )
  );

  // Check for known named brand colors if hex codes are sparse
  const lowerText = normalized.toLowerCase();
  const namedMatches = Object.entries(NAMED_COLOR_MAP)
    .filter(([key]) => lowerText.includes(key))
    .map(([, label]) => label);

  const combinedColors = Array.from(new Set([...hexMatches, ...namedMatches]));

  // 2. Deterministic Sentence Extraction for Logo, Imagery & Compliance
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 320);

  const findRuleSnippet = (keywords: string[], defaultFallback: string) => {
    const hits = sentences.filter((s) =>
      keywords.some((kw) => s.toLowerCase().includes(kw))
    );
    return hits.length > 0 ? hits.slice(0, 2).join(" ") : defaultFallback;
  };

  const logoRules = findRuleSnippet(
    ["logo", "clear space", "clear-space", "wordmark", "top left", "header"],
    "Place primary client logo in top-left header with clear breathing room and high contrast."
  );

  const imageGuidance = findRuleSnippet(
    ["photo", "imagery", "image", "gradient", "illustration", "graphic", "ratio"],
    "Use clean, high-contrast brand photography with balanced HTML text-to-image ratio."
  );

  const mandatoryFooter = findRuleSnippet(
    ["unsubscribe", "disclaimer", "footer", "fsp", "regulated", "privacy"],
    "Include mandatory legal disclaimer, physical address, and visible unsubscribe link."
  );

  const primaryHex = combinedColors.slice(0, 4);
  const secondaryHex = combinedColors.slice(4, 10);

  // Flag for tiny text-only AI cleanup ONLY if the PDF had almost no selectable text or zero colors
  const needsAiEnrichment = normalized.length < 80 || primaryHex.length === 0;

  return {
    rawText: normalized,
    needsAiEnrichment,
    profile: {
      brandName: fallbackName,
      colors: {
        primaryHex: primaryHex.length > 0 ? primaryHex : ["#000000", "#FFFFFF"],
        secondaryHex,
        ctaButtonRule:
          "Use primary brand accent fill with high-contrast white or dark text.",
      },
      logoRules,
      imageGuidance,
      toneAndCompliance: {
        toneAdjectives: ["Clear", "Professional", "Trustworthy"],
        forbiddenWords: [],
        mandatoryFooter,
      },
    },
  };
}
