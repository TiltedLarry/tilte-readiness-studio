"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";

function StudioCampaignContent() {
  const params = useParams<{ campaignId: string }>();
  const campaignId = params?.campaignId ?? "new-campaign";

  const [styleGuides, setStyleGuides] = useState<StyleGuideProfile[]>([]);

  useEffect(() => {
    fetch("/api/style-guide")
      .then((res) => res.json())
      .then((data) => setStyleGuides(data.guides || []))
      .catch(console.error);
  }, []);

  return (
    <main className="h-screen flex flex-col bg-[#F8FAFD] text-[#1F1F1F]">
      <header className="h-16 px-6 flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-[#444746] hover:text-[#1F1F1F]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Studio</span>
        </Link>
        <span className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-[#F0F4F9] text-[#444746] font-mono">
          Campaign: {campaignId}
        </span>
      </header>

      <div className="flex-1 overflow-hidden px-4 pb-4">
        <StudioWorkspace styleGuides={styleGuides} />
      </div>
    </main>
  );
}

export default function StudioWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#444746]">Loading studio...</div>}>
      <StudioCampaignContent />
    </Suspense>
  );
}
