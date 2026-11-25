import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type AppOptions,
} from "firebase-admin/app";
import { getFirestore, type CollectionReference } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { FinalAuditReport } from "@/lib/schemas/audit.schema";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucketName =
    process.env.FIREBASE_STORAGE_BUCKET ??
    process.env.VITE_FIREBASE_STORAGE_BUCKET;

  const options: AppOptions = {};
  if (projectId) options.projectId = projectId;
  if (storageBucketName) options.storageBucket = storageBucketName;

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

function db() {
  return getFirestore(getFirebaseAdminApp());
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
};

export const storageBucket = new Proxy(
  {} as ReturnType<ReturnType<typeof getStorage>["bucket"]>,
  {
    get(_target, prop) {
      const bucket = getStorage(getFirebaseAdminApp()).bucket();
      const value = Reflect.get(bucket, prop, bucket);
      return typeof value === "function" ? value.bind(bucket) : value;
    },
  }
);

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

export async function saveAuditReport(report: FinalAuditReport): Promise<string> {
  const docRef = await collections.auditReports.add(report);
  return docRef.id;
}
