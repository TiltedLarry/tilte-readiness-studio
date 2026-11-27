import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type AppOptions,
} from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore, type CollectionReference } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import type { FinalAuditReport } from "@/lib/schemas/audit.schema";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import {
  EMAIL_BEST_PRACTICES_RUBRIC,
  type RubricRuleDefinition,
} from "@/lib/scoring/rubric";

export const SUPER_ADMIN_EMAIL = "larry.moyo@tilte.cx";

export function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
  );
}

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  if (!hasAdminCredentials()) {
    throw new Error(
      "Firebase Admin credentials are not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_KEY) in .env.local."
    );
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const options: AppOptions = {};
  if (projectId) options.projectId = projectId;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (serviceAccountJson) {
    options.credential = cert(JSON.parse(serviceAccountJson));
  } else if (projectId && clientEmail && privateKey) {
    options.credential = cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  return initializeApp(options);
}

const globalForFirebase = globalThis as unknown as {
  firestoreConfigured?: boolean;
};

function db() {
  const instance = getFirestore(getFirebaseAdminApp());
  if (!globalForFirebase.firestoreConfigured) {
    instance.settings({
      ignoreUndefinedProperties: true,
      preferRest: true, // Uses fast HTTP/REST instead of hanging gRPC sockets in serverless
    });
    globalForFirebase.firestoreConfigured = true;
  }
  return instance;
}

export const collections = {
  get campaigns(): CollectionReference {
    return db().collection("campaigns");
  },
  get styleGuides(): CollectionReference {
    return db().collection("styleGuides");
  },
  get auditReports(): CollectionReference {
    return db().collection("auditReports");
  },
  get platformConfig(): CollectionReference {
    return db().collection("platform_config");
  },
};

export async function verifyBearerToken(
  req: NextRequest
): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  return getAuth(getFirebaseAdminApp()).verifyIdToken(token);
}

export async function getStyleGuideById(
  styleGuideId: string
): Promise<StyleGuideProfile> {
  const doc = await collections.styleGuides.doc(styleGuideId).get();
  if (!doc.exists) {
    throw new Error(`Style guide "${styleGuideId}" not found.`);
  }
  return {
    id: doc.id,
    ...(doc.data() as Omit<StyleGuideProfile, "id">),
  };
}

export async function saveAuditReport(
  report: FinalAuditReport,
  meta?: {
    ownerUid?: string;
    ownerEmail?: string;
    campaignName?: string;
    styleGuideId?: string;
  }
): Promise<string> {
  const docRef = await collections.auditReports.add({
    ...report,
    ...(meta?.ownerUid ? { ownerUid: meta.ownerUid } : {}),
    ...(meta?.ownerEmail ? { ownerEmail: meta.ownerEmail } : {}),
    ...(meta?.campaignName ? { campaignName: meta.campaignName } : {}),
    ...(meta?.styleGuideId ? { styleGuideId: meta.styleGuideId } : {}),
  });
  return docRef.id;
}

export async function getActiveBestPractices(): Promise<RubricRuleDefinition[]> {
  const docRef = collections.platformConfig.doc("best_practices");
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    await docRef.set({
      rules: EMAIL_BEST_PRACTICES_RUBRIC,
      updatedAt: new Date().toISOString(),
      updatedBy: "system_seed",
    });
    return EMAIL_BEST_PRACTICES_RUBRIC;
  }
  const data = snapshot.data() as { rules?: RubricRuleDefinition[] } | undefined;
  return Array.isArray(data?.rules) && data.rules.length > 0
    ? data.rules
    : EMAIL_BEST_PRACTICES_RUBRIC;
}

export async function saveBestPractices(
  rules: RubricRuleDefinition[],
  updatedBy: string
): Promise<void> {
  await collections.platformConfig.doc("best_practices").set({
    rules,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
}
