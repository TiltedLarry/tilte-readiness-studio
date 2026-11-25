import React, { Suspense } from "react";
import { connection } from "next/server";
import { Sparkles } from "lucide-react";
import { collections } from "@/lib/db/firebaseAdmin";
import { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";

async function StudioWorkspaceLoader() {
  await connection();
  let styleGuides: StyleGuideProfile[] = [];
  try {
    const snapshot = await collections.styleGuides.get();
    styleGuides = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<StyleGuideProfile, "id">),
    }));
  } catch {
    styleGuides = [];
  }

  return <StudioWorkspace styleGuides={styleGuides} />;
}

export default function HomePage() {
  return (
    <main className="h-screen flex flex-col bg-[#F8FAFD] text-[#1F1F1F]">
      <header className="h-16 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="font-medium text-base text-[#1F1F1F] tracking-tight">
            Email Campaign Readiness Studio
          </h1>
        </div>
        <span className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-[#F0F4F9] text-[#444746]">
          Rubric-Enforced Pre-Flight Audit
        </span>
      </header>

      <div className="flex-1 overflow-hidden px-4 pb-4">
        <Suspense fallback={<StudioWorkspace styleGuides={[]} />}>
          <StudioWorkspaceLoader />
        </Suspense>
      </div>
    </main>
  );
}
