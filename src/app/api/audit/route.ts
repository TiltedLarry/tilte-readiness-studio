import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runCopyAudit } from "@/lib/ai/copyAuditor";
import { runInboxSimulation } from "@/lib/ai/inboxSimulator";
import { runVisualAudit } from "@/lib/ai/visualAuditor";
import {
  collections,
  getActiveBestPractices,
  getStyleGuideById,
  saveAuditReport,
  storageBucket,
  verifyBearerToken,
} from "@/lib/db/firebaseAdmin";
import { buildFinalAuditReport } from "@/lib/scoring/calculator";

// Validate text fields coming from FormData
const AuditFormSchema = z.object({
  campaignName: z.string().min(1, "Campaign name is required"),
  styleGuideId: z.string().min(1, "Style guide selection is required"),
  subjectLine: z.string().min(1, "Subject line is required"),
  previewText: z.string().default(""),
  bodyCopy: z.string().min(10, "Body copy is too short to audit"),
});

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export async function POST(req: NextRequest) {
  try {
    const decodedUser = await verifyBearerToken(req);
    const formData = await req.formData();

    // 1. Validate text inputs
    const parsedFields = AuditFormSchema.safeParse({
      campaignName: formData.get("campaignName"),
      styleGuideId: formData.get("styleGuideId"),
      subjectLine: formData.get("subjectLine"),
      previewText: formData.get("previewText") || "",
      bodyCopy: formData.get("bodyCopy"),
    });

    if (!parsedFields.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsedFields.error.flatten() },
        { status: 400 }
      );
    }

    // 2. Validate Figma PNG upload
    const imageFile = formData.get("designImage") as File | null;
    if (!imageFile) {
      return NextResponse.json(
        { error: "Exported Figma design PNG is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(imageFile.type as AllowedMimeType)) {
      return NextResponse.json(
        { error: "Unsupported image type. Please upload PNG, JPEG, or WebP." },
        { status: 400 }
      );
    }

    const { campaignName, styleGuideId, subjectLine, previewText, bodyCopy } =
      parsedFields.data;

    // 3. Fetch Style Guide, active Platform Best Practices & convert image buffer to Base64
    const [styleGuide, activeRubric, arrayBuffer] = await Promise.all([
      getStyleGuideById(styleGuideId),
      getActiveBestPractices(),
      imageFile.arrayBuffer(),
    ]);

    const imageBuffer = Buffer.from(arrayBuffer);
    const imageBase64 = imageBuffer.toString("base64");

    // 4. Upload PNG to Firebase Storage (non-blocking fallback if bucket isn't enabled yet)
    let savedStoragePath: string | null = null;
    try {
      const storagePath = `campaigns/${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
      await storageBucket.file(storagePath).save(imageBuffer, {
        metadata: { contentType: imageFile.type },
      });
      savedStoragePath = storagePath;
    } catch (storageErr) {
      console.warn(
        "[STORAGE_SKIPPED]: Firebase Storage bucket unavailable, continuing audit in memory.",
        storageErr
      );
    }

    const campaignDoc = await collections.campaigns.add({
      campaignName,
      styleGuideId,
      subjectLine,
      previewText,
      bodyCopy,
      pngStoragePath: savedStoragePath,
      ownerUid: decodedUser?.uid ?? null,
      ownerEmail: decodedUser?.email ?? null,
      createdAt: new Date().toISOString(),
    });

    // 5. Run the 3 isolated Gemini Auditors in parallel (Fastest total latency)
    const [copyAudit, inboxSimulation, visualAudit] = await Promise.all([
      runCopyAudit({
        subjectLine,
        previewText,
        bodyCopy,
        styleGuide,
        rubric: activeRubric,
      }),
      runInboxSimulation(subjectLine, previewText, bodyCopy),
      runVisualAudit({
        imageBase64,
        mimeType: imageFile.type as AllowedMimeType,
        styleGuide,
        rubric: activeRubric,
      }),
    ]);

    // 6. Compute deterministic grade (Zero AI math)
    const finalReport = buildFinalAuditReport({
      campaignId: campaignDoc.id,
      copyAudit,
      visualAudit,
      inboxSimulation,
      rubric: activeRubric,
    });

    // 7. Save immutable report to Firestore with ownerUid & ownerEmail
    const reportId = await saveAuditReport(finalReport, {
      ownerUid: decodedUser?.uid,
      ownerEmail: decodedUser?.email,
      campaignName,
      styleGuideId,
    });

    return NextResponse.json(
      {
        reportId,
        campaignId: campaignDoc.id,
        report: finalReport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AUDIT_PIPELINE_ERROR]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error during campaign audit.",
      },
      { status: 500 }
    );
  }
}
