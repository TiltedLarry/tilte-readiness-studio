import { GoogleGenAI, GenerateContentParameters } from "@google/genai";
import { z } from "zod";

export const ai = new GoogleGenAI({});

export const PRIMARY_TEXT_MODEL = "auto-text-primary";
export const FALLBACK_TEXT_MODEL = "auto-text-fallback";
export const PRIMARY_VISUAL_MODEL = "auto-visual-primary";
export const FALLBACK_VISUAL_MODEL = "auto-visual-fallback";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function stripUnsupportedSchemaKeys(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(stripUnsupportedSchemaKeys);
  }
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      if (
        ["$schema", "$defs", "definitions", "$ref", "additionalProperties"].includes(
          key
        )
      ) {
        continue;
      }
      out[key] = stripUnsupportedSchemaKeys(value);
    }
    return out;
  }
  return node;
}

export function toGeminiResponseSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema, { reused: "inline" });
  return stripUnsupportedSchemaKeys(jsonSchema) as Record<string, unknown>;
}

// Tracks temporarily overloaded models (503/429) for 60s so parallel calls skip them immediately
const overloadedUntil = new Map<string, number>();

let cachedModels: {
  textChain: string[];
  visualChain: string[];
  fetchedAt: number;
} | null = null;

async function resolveAvailableModelChains() {
  if (cachedModels && Date.now() - cachedModels.fetchedAt < 3600_000) {
    return cachedModels;
  }

  const pager = await ai.models.list();
  const validIds: string[] = [];

  for await (const model of pager) {
    const id = (model.name || "").replace(/^models\//, "");

    const supportsGenerate =
      !model.supportedActions ||
      model.supportedActions.includes("generateContent");

    // Include both Gemini and Gemma-3 (multimodal/text) models available on your key
    const isUsableModel =
      (id.startsWith("gemini-") || id.startsWith("gemma-3")) &&
      !id.includes("embedding") &&
      !id.includes("imagen") &&
      !id.includes("veo") &&
      !id.includes("tts") &&
      !id.includes("robotics") &&
      !id.includes("computer-use");

    if (supportsGenerate && isUsableModel) {
      validIds.push(id);
    }
  }

  // Deduplicate version aliases (e.g. keep base model over -001/-latest duplicates)
  const uniqueFamilies = new Map<string, string>();
  validIds
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .forEach((id) => {
      const baseFamily = id.replace(/-(00\d|latest|exp.*)$/, "");
      if (!uniqueFamilies.has(baseFamily)) {
        uniqueFamilies.set(baseFamily, id);
      }
    });

  const distinctIds = Array.from(uniqueFamilies.values());

  const flashModels = distinctIds.filter(
    (id) => id.includes("flash") && !id.includes("lite")
  );
  const liteModels = distinctIds.filter((id) => id.includes("lite"));
  const proModels = distinctIds.filter((id) => id.includes("pro"));
  const gemmaModels = distinctIds.filter((id) => id.startsWith("gemma-3"));

  // Distinct pools: Flash -> Flash-Lite -> Pro -> Gemma-3
  const textChain = Array.from(
    new Set([...flashModels, ...liteModels, ...proModels, ...gemmaModels])
  );
  const visualChain = Array.from(
    new Set([...proModels, ...flashModels, ...liteModels, ...gemmaModels])
  );

  if (textChain.length === 0) {
    throw new Error("No generateContent-capable models found on this API key.");
  }

  cachedModels = {
    textChain,
    visualChain,
    fetchedAt: Date.now(),
  };

  return cachedModels;
}

export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model">,
  primaryHint: string,
  _fallbackHint?: string
) {
  void _fallbackHint;
  const { textChain, visualChain } = await resolveAvailableModelChains();
  const fullChain = primaryHint.includes("visual") ? visualChain : textChain;
  const now = Date.now();

  // Prioritize models that haven't recently thrown 503
  const healthyFirst = [
    ...fullChain.filter((id) => (overloadedUntil.get(id) || 0) <= now),
    ...fullChain.filter((id) => (overloadedUntil.get(id) || 0) > now),
  ];

  let lastError: unknown;

  for (let i = 0; i < healthyFirst.length; i++) {
    const modelId = healthyFirst[i];

    // Add randomized jitter (400ms–1400ms) on retries so parallel requests don't collide
    if (i > 0) {
      const jitter = 400 + Math.floor(Math.random() * 1000);
      await sleep(jitter);
    }

    try {
      return await ai.models.generateContent({
        ...params,
        model: modelId,
      });
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      const message = (err as { message?: string })?.message || "";

      const isTransient =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 400 ||
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("NOT_FOUND");

      if (status === 503 || status === 429) {
        // Put this specific model in a 60-second cooldown
        overloadedUntil.set(modelId, Date.now() + 60_000);
      }

      if (!isTransient) {
        throw err;
      }
    }
  }

  throw lastError;
}
