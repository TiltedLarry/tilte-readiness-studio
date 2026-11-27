import React, { Suspense } from "react";
import { connection } from "next/server";
import { collections, hasAdminCredentials } from "@/lib/db/firebaseAdmin";
import { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import { AuthenticatedStudioApp } from "@/components/studio/AuthenticatedStudioApp";

async function StudioAppLoader() {
  await connection();
  let styleGuides: StyleGuideProfile[] = [];
  if (hasAdminCredentials()) {
    try {
      const snapshot = await Promise.race([
        collections.styleGuides.get(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);
      if (snapshot) {
        styleGuides = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<StyleGuideProfile, "id">),
        }));
      }
    } catch {
      styleGuides = [];
    }
  }

  return <AuthenticatedStudioApp styleGuides={styleGuides} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<AuthenticatedStudioApp styleGuides={[]} />}>
      <StudioAppLoader />
    </Suspense>
  );
}
