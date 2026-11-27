import { GoogleGenAI, GenerateContentParameters } from "@google/genai";
import { z } from "zod";

export const ai = new GoogleGenAI({
  httpOptions: {
    timeout: 12_000, // Fail fast at 12s so OpenRouter takes over immediately
  },
});

export const PRIMARY_TEXT_MODEL = "auto-text-primary";
export const FALLBACK_TEXT_MODEL = "auto-text-fallback";
export const PRIMARY_VISUAL_MODEL = "auto-visual-primary";
export const FALLBACK_VISUAL_MODEL = "auto-visual-fallback";

// Paid OpenRouter multimodal models (supports PNG images, PDFs & strict JSON)
const OPENROUTER_VISUAL_MODEL = "google/gemini-2.5-flash";
const OPENROUTER_BACKUP_MODEL = "openai/gpt-4o-mini";

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

const overloadedUntil = new Map<string, number>();

let cachedGeminiModels: {
  textChain: string[];
  visualChain: string[];
  fetchedAt: number;
} | null = null;

async function resolveAvailableGeminiChains() {
  if (cachedGeminiModels && Date.now() - cachedGeminiModels.fetchedAt < 3600_000) {
    return cachedGeminiModels;
  }

  const pager = await ai.models.list();
  const validIds: string[] = [];

  for await (const model of pager) {
    const id = (model.name || "").replace(/^models\//, "");
    const supportsGenerate =
      !model.supportedActions ||
      model.supportedActions.includes("generateContent");

    const isUsable =
      id.startsWith("gemini-") &&
      !id.includes("preview") &&
      !id.includes("exp") &&
      !id.includes("embedding") &&
      !id.includes("imagen") &&
      !id.includes("veo") &&
      !id.includes("tts") &&
      !id.includes("robotics") &&
      !id.includes("computer-use");

    if (supportsGenerate && isUsable) {
      validIds.push(id);
    }
  }

  const uniqueFamilies = new Map<string, string>();
  validIds
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .forEach((id) => {
      const base = id.replace(/-(00\d|latest|exp.*)$/, "");
      if (!uniqueFamilies.has(base)) uniqueFamilies.set(base, id);
    });

  const distinct = Array.from(uniqueFamilies.values());
  const flashModels = distinct.filter((id) => id.includes("flash"));
  const proModels = distinct.filter((id) => id.includes("pro"));

  cachedGeminiModels = {
    textChain: Array.from(new Set([...flashModels, ...proModels, ...distinct])),
    visualChain: Array.from(new Set([...flashModels, ...proModels, ...distinct])),
    fetchedAt: Date.now(),
  };

  return cachedGeminiModels;
}

/**
 * Translates Gemini GenerateContentParameters (including Base64 PNG/PDF inlineData
 * and responseSchema) into an OpenRouter Chat Completions call.
 */
async function callOpenRouterFallback(
  params: Omit<GenerateContentParameters, "model">,
  modelId: string
): Promise<{ text: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing in .env.local.");
  }

  const config = (params.config || {}) as Record<string, unknown>;
  const rawSystem =
    typeof config.systemInstruction === "string"
      ? config.systemInstruction
      : "";
  const responseSchema = config.responseSchema;

  const systemContent = responseSchema
    ? `${rawSystem}\n\nCRITICAL OUTPUT FORMAT:\nReturn ONLY raw, valid JSON (no markdown \`\`\`json fences, no commentary) strictly matching this JSON Schema:\n${JSON.stringify(responseSchema)}`
    : rawSystem;

  // Normalize Gemini contents into OpenAI/OpenRouter multimodal content parts
  const contentParts: Array<Record<string, unknown>> = [];
  const rawContents = Array.isArray(params.contents)
    ? params.contents
    : [params.contents];

  for (const item of rawContents) {
    if (typeof item === "string") {
      contentParts.push({ type: "text", text: item });
    } else if (item && typeof item === "object") {
      // Handle { inlineData: { data, mimeType } }
      if ("inlineData" in item && item.inlineData) {
        const { data, mimeType } = item.inlineData as {
          data: string;
          mimeType: string;
        };
        contentParts.push({
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${data}`,
          },
        });
      }
      // Handle { role, parts: [...] } message objects (used by Corner Chat)
      if ("parts" in item && Array.isArray(item.parts)) {
        for (const p of item.parts) {
          if (typeof p === "string") {
            contentParts.push({ type: "text", text: p });
          } else if (p && typeof p === "object" && "text" in p) {
            contentParts.push({ type: "text", text: p.text });
          }
        }
      }
    }
  }

  const messages: Array<Record<string, unknown>> = [];
  if (systemContent.trim()) {
    messages.push({ role: "system", content: systemContent.trim() });
  }
  messages.push({ role: "user", content: contentParts });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Email Campaign Readiness Studio",
    },
    body: JSON.stringify({
      model: modelId,
      temperature: typeof config.temperature === "number" ? config.temperature : 0.1,
      ...(responseSchema ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      `OpenRouter (${modelId}) error ${response.status}: ${
        data?.error?.message || JSON.stringify(data)
      }`
    );
  }

  const rawText: string = data.choices?.[0]?.message?.content || "";
  const cleanText = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return { text: cleanText };
}

export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model">,
  primaryHint: string,
  _fallbackHint?: string
) {
  void _fallbackHint;
  const now = Date.now();

  // 1. Try top healthy Gemini model first (with 12s fast-fail)
  try {
    const { textChain, visualChain } = await resolveAvailableGeminiChains();
    const chain = primaryHint.includes("visual") ? visualChain : textChain;
    const healthyGemini = chain.find(
      (id) => (overloadedUntil.get(id) || 0) <= now
    );

    if (healthyGemini) {
      return await ai.models.generateContent({
        ...params,
        model: healthyGemini,
      });
    }
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const message = (err as { message?: string })?.message || "";
    console.warn(
      `[GEMINI_FAILOVER -> OPENROUTER]: ${status || ""} ${message}`
    );

    // Put Gemini on a 2-minute cooldown if overloaded so subsequent calls jump straight to OpenRouter
    if (
      status === 503 ||
      status === 429 ||
      message.includes("503") ||
      message.includes("UNAVAILABLE") ||
      message.includes("aborted")
    ) {
      if (cachedGeminiModels) {
        [...cachedGeminiModels.textChain, ...cachedGeminiModels.visualChain].forEach(
          (id) => overloadedUntil.set(id, Date.now() + 120_000)
        );
      }
    }
  }

  // 2. Seamless OpenRouter Failover (Primary -> Backup Multimodal Model)
  try {
    return await callOpenRouterFallback(params, OPENROUTER_VISUAL_MODEL);
  } catch (orErr) {
    console.warn("[OPENROUTER_PRIMARY_RETRY]:", orErr);
    return await callOpenRouterFallback(params, OPENROUTER_BACKUP_MODEL);
  }
}
