import { NextRequest, NextResponse } from "next/server";
import { scanStyleGuideLocally } from "@/lib/ci/localCiScanner";
import { extractStyleGuideFromFile } from "@/lib/ai/guideExtractor";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Please attach at least one PDF, TXT, or Markdown file." },
        { status: 400 }
      );
    }

    const previews = await Promise.all(
      files.map(async (file) => {
        const mimeType =
          file.type ||
          (file.name.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : "text/plain");
        const buffer = Buffer.from(await file.arrayBuffer());
        const fallbackName = file.name.replace(/\.[^/.]+$/, "");

        // Step 1: Instant local regex + PDF text scan (< 100ms)
        const localResult = await scanStyleGuideLocally(
          buffer,
          mimeType,
          fallbackName
        );

        // If local scan extracted colors & text cleanly, return immediately!
        if (!localResult.needsAiEnrichment) {
          return localResult.profile;
        }

        // Step 2: Only fall back to multimodal AI if the PDF was image-only / scanned
        return extractStyleGuideFromFile(buffer, mimeType, fallbackName);
      })
    );

    return NextResponse.json({ previews }, { status: 200 });
  } catch (error) {
    console.error("[CI_EXTRACT_ERROR]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract Corporate CI rules.",
      },
      { status: 500 }
    );
  }
}
