import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  FALLBACK_TEXT_MODEL,
  generateWithFallback,
  PRIMARY_TEXT_MODEL,
} from "@/lib/ai/geminiClient";
import { collections, getStyleGuideById } from "@/lib/db/firebaseAdmin";
import { FinalAuditReport } from "@/lib/schemas/audit.schema";
import {
  ANTI_INJECTION_SYSTEM_POLICY,
  PromptInjectionError,
  sanitizeUntrustedInput,
  wrapUntrustedData,
} from "@/lib/security/promptGuard";

const ChatRequestSchema = z.object({
  reportId: z.string().min(1),
  styleGuideId: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      text: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chat payload" },
        { status: 400 }
      );
    }

    const { reportId, styleGuideId, messages } = parsed.data;

    let sanitizedMessages: Array<{ role: "user" | "model"; text: string }>;
    try {
      sanitizedMessages = messages.map((m) =>
        m.role === "user"
          ? {
              role: "user",
              text: wrapUntrustedData(
                "user_question",
                sanitizeUntrustedInput(m.text, "Chat Message", 2000)
              ),
            }
          : m
      );
    } catch (secErr) {
      if (secErr instanceof PromptInjectionError) {
        return NextResponse.json({ error: secErr.message }, { status: 400 });
      }
      throw secErr;
    }

    // 1. Load the exact saved report and style guide from Firestore
    const [reportDoc, styleGuide] = await Promise.all([
      collections.auditReports.doc(reportId).get(),
      getStyleGuideById(styleGuideId),
    ]);

    if (!reportDoc.exists) {
      return NextResponse.json(
        { error: "Audit report not found." },
        { status: 404 }
      );
    }

    const report = reportDoc.data() as FinalAuditReport;

    // 2. Hard-lock the system prompt to these two JSON objects + anti-injection policy
    const systemInstruction = `
${ANTI_INJECTION_SYSTEM_POLICY}

You are the Email Campaign Readiness Assistant. You help campaign managers understand and fix issues flagged in their active Audit Report.

STRICT BOUNDARIES:
1. Answer questions ONLY using the Audit Report JSON and Brand Style Guide JSON provided below.
2. You CANNOT change scores, override blockers, or approve a campaign.
3. If the user asks about unrelated topics, general coding, or marketing outside this specific email campaign, politely decline and ask which flagged rule from their report they would like to fix first.
4. Keep answers concise, tactical, and actionable—suggest exact copy rewrites or Figma layout tweaks when asked.

ACTIVE BRAND STYLE GUIDE:
${JSON.stringify(styleGuide, null, 2)}

ACTIVE AUDIT REPORT:
${JSON.stringify(report, null, 2)}
`;

    // Format conversation history for Gemini
    const formattedContents = sanitizedMessages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const response = await generateWithFallback(
      {
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      },
      PRIMARY_TEXT_MODEL,
      FALLBACK_TEXT_MODEL
    );

    return NextResponse.json({
      reply:
        response.text ||
        "I couldn't generate a response based on this report. Please try rephrasing.",
    });
  } catch (error) {
    console.error("[FAB_CHAT_ERROR]:", error);
    return NextResponse.json(
      { error: "Assistant failed to respond." },
      { status: 500 }
    );
  }
}
