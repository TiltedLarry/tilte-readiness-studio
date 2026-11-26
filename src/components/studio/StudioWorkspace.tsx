"use client";

import React, { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { FinalAuditReport } from "@/lib/schemas/audit.schema";
import { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import { CampaignInputForm } from "./CampaignInputForm";
import { ScoreHeader } from "./ScoreHeader";
import { InboxPreviewCard } from "./InboxPreviewCard";
import { DiagnosticTabs } from "./DiagnosticTabs";
import { ContextChatFab } from "./ContextChatFab";

interface ActiveAuditState {
  reportId: string;
  campaignId: string;
  styleGuideId: string;
  report: FinalAuditReport;
}

export function StudioWorkspace({
  styleGuides,
  externalAudit,
}: {
  styleGuides: StyleGuideProfile[];
  externalAudit?: ActiveAuditState | null;
}) {
  const [localAudit, setLocalAudit] = useState<ActiveAuditState | null>(null);
  const [lastExternalId, setLastExternalId] = useState<string | null>(null);

  const externalId = externalAudit?.reportId ?? null;
  if (externalAudit && externalId !== lastExternalId) {
    setLastExternalId(externalId);
    setLocalAudit(externalAudit);
  }

  const activeAudit = localAudit;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Pane: Natural Content Height (Scrolls with page) */}
      <div className="lg:col-span-5">
        <CampaignInputForm
          styleGuides={styleGuides}
          onAuditComplete={(result) => setLocalAudit(result)}
        />
      </div>

      {/* Right Pane: Readiness Report */}
      <div className="lg:col-span-7 space-y-4">
        {!activeAudit ? (
          <div className="min-h-[640px] bg-white rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <div className="w-14 h-14 rounded-full bg-[#F0F4F9] text-[#0B57D0] flex items-center justify-center mb-4">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-medium text-[#1F1F1F]">
              No Campaign Audited Yet
            </h3>
            <p className="text-sm text-[#444746] max-w-md mt-1.5 leading-relaxed">
              Select or upload a Client Corporate CI guide, paste your email
              copy, and attach your Figma PNG on the left to generate your
              pre-flight readiness report.
            </p>
          </div>
        ) : (
          <>
            <ScoreHeader report={activeAudit.report} />
            <InboxPreviewCard simulation={activeAudit.report.inboxSimulation} />
            <DiagnosticTabs report={activeAudit.report} />

            {/* Context-Locked Corner FAB */}
            <ContextChatFab
              reportId={activeAudit.reportId}
              styleGuideId={activeAudit.styleGuideId}
            />
          </>
        )}
      </div>
    </div>
  );
}
