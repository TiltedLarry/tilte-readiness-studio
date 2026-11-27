"use client";

import React, { useEffect, useState } from "react";
import { FileCheck2, Loader2 } from "lucide-react";
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

const AUDIT_STAGES = [
  { threshold: 0, label: "Auditing subject line & copy alignment..." },
  { threshold: 30, label: "Simulating Apple Mail & Gmail AI summaries..." },
  { threshold: 62, label: "Inspecting Figma PNG against Corporate CI..." },
  { threshold: 88, label: "Computing deterministic rubric score..." },
];

export function StudioWorkspace({
  styleGuides,
  externalAudit,
}: {
  styleGuides: StyleGuideProfile[];
  externalAudit?: ActiveAuditState | null;
}) {
  const [localAudit, setLocalAudit] = useState<ActiveAuditState | null>(null);
  const [lastExternalId, setLastExternalId] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);

  const externalId = externalAudit?.reportId ?? null;
  if (externalAudit && externalId !== lastExternalId) {
    setLastExternalId(externalId);
    setLocalAudit(externalAudit);
  }

  useEffect(() => {
    if (!isAuditing) return;
    const interval = setInterval(() => {
      setAuditProgress((prev) => {
        if (prev >= 94) return 94;
        const increment = prev < 45 ? 6 : prev < 75 ? 3.5 : 1.5;
        return Math.min(94, Math.round((prev + increment) * 10) / 10);
      });
    }, 550);
    return () => clearInterval(interval);
  }, [isAuditing]);

  const currentAuditStage =
    [...AUDIT_STAGES]
      .reverse()
      .find((s) => auditProgress >= s.threshold)?.label ||
    "Auditing subject line & copy alignment...";

  const activeAudit = localAudit;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
      {/* Left Pane: Natural Content Height (Scrolls with page) */}
      <div className="lg:col-span-5">
        <CampaignInputForm
          styleGuides={styleGuides}
          onAuditStart={() => {
            setAuditProgress(8);
            setIsAuditing(true);
          }}
          onAuditEnd={() => {
            setIsAuditing(false);
            setAuditProgress(0);
          }}
          onAuditComplete={(result) => setLocalAudit(result)}
        />
      </div>

      {/* Right Pane: Readiness Report */}
      <div className="lg:col-span-7 space-y-6">
        {isAuditing ? (
          <div className="min-h-[640px] bg-white rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EDF2FA] text-[#0B57D0] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium text-[#1F1F1F]">
                {currentAuditStage}
              </h3>
              <p className="text-xs font-medium text-[#0B57D0]">
                {Math.round(auditProgress)}% complete
              </p>
            </div>
            <div className="w-full max-w-xs h-2 bg-[#D3E3FD] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0B57D0] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${auditProgress}%` }}
              />
            </div>
          </div>
        ) : !activeAudit ? (
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
