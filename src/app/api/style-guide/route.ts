import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { collections, hasAdminCredentials } from "@/lib/db/firebaseAdmin";
import { StyleGuideProfileSchema } from "@/lib/schemas/styleGuide.schema";

const SaveGuidesPayloadSchema = z.object({
  guides: z.array(StyleGuideProfileSchema).min(1),
});

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
    const body = await req.json();
    const parsed = SaveGuidesPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid style guide data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const savedGuides = await Promise.all(
      parsed.data.guides.map(async (profile) => {
        const cleanData = { ...profile };
        delete cleanData.id;
        const docRef = await collections.styleGuides.add(cleanData);
        return { id: docRef.id, ...cleanData };
      })
    );

    return NextResponse.json({ guides: savedGuides }, { status: 201 });
  } catch (error) {
    console.error("[CI_SAVE_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to save approved style guides." },
      { status: 500 }
    );
  }
}
