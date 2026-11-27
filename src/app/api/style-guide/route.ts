import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { collections, hasAdminCredentials } from "@/lib/db/firebaseAdmin";
import { StyleGuideProfileSchema } from "@/lib/schemas/styleGuide.schema";

// Strip `id` before validating so AI-generated slug IDs never trigger UUID validation errors
const IncomingGuideSchema = StyleGuideProfileSchema.omit({ id: true }).extend({
  id: z.string().optional(),
});

const SaveGuidesPayloadSchema = z.object({
  guides: z.array(IncomingGuideSchema).min(1),
});

export async function GET() {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ guides: [] }, { status: 200 });
  }
  try {
    const snapshot = await collections.styleGuides.get();
    const guides = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ guides }, { status: 200 });
  } catch (error) {
    console.error("[CI_FETCH_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to load Corporate CI guides." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SaveGuidesPayloadSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[CI_VALIDATION_ERROR]:", parsed.error.flatten());
      return NextResponse.json(
        {
          error: "Invalid style guide format. Please check all fields.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const savedGuides = await Promise.all(
      parsed.data.guides.map(async (profile) => {
        const rest = { ...profile };
        delete rest.id;

        // Deep-clone through JSON to strip any `undefined` keys that Firestore rejects
        const cleanData = JSON.parse(
          JSON.stringify({
            ...rest,
            createdAt: new Date().toISOString(),
          })
        );

        const docRef = await collections.styleGuides.add(cleanData);
        return { id: docRef.id, ...cleanData };
      })
    );

    return NextResponse.json({ guides: savedGuides }, { status: 201 });
  } catch (error) {
    console.error("[CI_SAVE_ERROR]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save approved style guides to Firestore.",
      },
      { status: 500 }
    );
  }
}
