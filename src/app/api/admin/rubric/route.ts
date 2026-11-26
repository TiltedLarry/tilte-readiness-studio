import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getActiveBestPractices,
  hasAdminCredentials,
  saveBestPractices,
  SUPER_ADMIN_EMAIL,
  verifyBearerToken,
} from "@/lib/db/firebaseAdmin";
import { EMAIL_BEST_PRACTICES_RUBRIC } from "@/lib/scoring/rubric";

const RuleSchema = z.object({
  ruleId: z.string().min(1),
  ruleTitle: z.string().min(1),
  category: z.enum(["copy", "visual", "compliance"]),
  pipeline: z.enum(["copy", "visual"]),
  weight: z.number().min(0).max(100),
  criteria: z.string().min(1),
  isBlocker: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

const UpdateRubricSchema = z.object({
  rules: z.array(RuleSchema).min(1),
});

export async function GET() {
  if (!hasAdminCredentials()) {
    return NextResponse.json({ rules: EMAIL_BEST_PRACTICES_RUBRIC });
  }
  try {
    const rules = await getActiveBestPractices();
    return NextResponse.json({ rules });
  } catch (error) {
    console.error("[SUPER_ADMIN_RUBRIC_GET_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to load platform best practices." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const decoded = await verifyBearerToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (decoded.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = UpdateRubricSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid rubric payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await saveBestPractices(parsed.data.rules, decoded.email);
    return NextResponse.json({ rules: parsed.data.rules });
  } catch (error) {
    console.error("[SUPER_ADMIN_RUBRIC_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to update platform best practices." },
      { status: 500 }
    );
  }
}
