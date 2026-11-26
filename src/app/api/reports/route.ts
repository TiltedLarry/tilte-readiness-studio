import { NextRequest, NextResponse } from "next/server";
import { collections, verifyBearerToken } from "@/lib/db/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await collections.auditReports
      .where("ownerUid", "==", decoded.uid)
      .get();

    const reports = snapshot.docs
      .map((doc) => ({
        reportId: doc.id,
        ...(doc.data() as Record<string, unknown>),
      }))
      .sort((a, b) => {
        const aTime = String((a as { createdAt?: string }).createdAt ?? "");
        const bTime = String((b as { createdAt?: string }).createdAt ?? "");
        return bTime.localeCompare(aTime);
      });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[PAST_REPORTS_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to load past reports." },
      { status: 500 }
    );
  }
}
