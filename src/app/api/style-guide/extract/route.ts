import { NextRequest, NextResponse } from "next/server";
import { extractStyleGuideFromFile } from "@/lib/ai/guideExtractor";

const SUPPORTED_GUIDE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];

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
        const mimeType = SUPPORTED_GUIDE_TYPES.includes(file.type)
          ? file.type
          : "text/plain";

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const cleanFallbackName = file.name.replace(/\.[^/.]+$/, "");

        return extractStyleGuideFromFile(buffer, mimeType, cleanFallbackName);
      })
    );

    return NextResponse.json({ previews }, { status: 200 });
  } catch (error) {
    console.error("[CI_EXTRACT_PREVIEW_ERROR]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract brand rules from uploaded file(s).",
      },
      { status: 500 }
    );
  }
}
