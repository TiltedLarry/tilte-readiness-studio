import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const TEXT_AUDIT_MODEL = "gemini-2.5-flash";
export const VISUAL_AUDIT_MODEL = "gemini-2.5-flash";
export const GEMINI_MODEL = TEXT_AUDIT_MODEL;

let cachedClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment.");
  }

  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export const ai: GoogleGenAI = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    const client = getGeminiClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function toGeminiResponseSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
}
