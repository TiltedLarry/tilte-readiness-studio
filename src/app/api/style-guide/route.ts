import { NextRequest, NextResponse } from "next/server";
import { extractStyleGuideFromFile } from "@/lib/ai/guideExtractor";
import { collections, hasAdminCredentials } from "@/lib/db/firebaseAdmin";

const SUPPORTED_GUIDE_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];

export async function GET() {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ guides: [] });
  }
  const snapshot = await collections.styleGuides.get();
  const guides = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return NextResponse.json({ guides });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          error:
            "Please upload at least one PDF, TXT, or Markdown style guide.",
        },
        { status: 400 }
      );
    }

    // Process all uploaded style guides in parallel
    const createdProfiles = await Promise.all(
      files.map(async (file) => {
        const mimeType = SUPPORTED_GUIDE_TYPES.includes(file.type)
          ? file.type
          : "text/plain"; // Fallback for .md files browsers sometimes label as octet-stream

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const cleanFallbackName = file.name.replace(/\.[^/.]+$/, "");

        const profile = await extractStyleGuideFromFile(
          buffer,
          mimeType,
          cleanFallbackName
        );

        const docRef = await collections.styleGuides.add(profile);
        return { id: docRef.id, ...profile };
      })
    );

    return NextResponse.json({ guides: createdProfiles }, { status: 201 });
  } catch (error) {
    console.error("[BATCH_STYLE_GUIDE_ERROR]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process uploaded style guides.",
      },
      { status: 500 }
    );
  }
}
