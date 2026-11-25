"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Wrench } from "lucide-react";
import { FinalAuditReport } from "@/lib/schemas/audit.schema";

type TabKey = "fixes" | "copy" | "visual";

export function DiagnosticTabs({ report }: { report: FinalAuditReport }) {
  const [activeTab, setActiveTab] = useState<TabKey>("fixes");

  const failedRules = report.evaluations.filter((e) => !e.passed);
  const copyRules = report.evaluations.filter(
    (e) => e.category === "copy" || e.category === "compliance"
  );
  const visualRules = report.evaluations.filter((e) => e.category === "visual");

  const displayedRules =
    activeTab === "fixes"
      ? failedRules
      : activeTab === "copy"
      ? copyRules
      : visualRules;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "fixes", label: "Actionable Fixes", count: failedRules.length },
    { key: "copy", label: "Copy & Compliance", count: copyRules.length },
    { key: "visual", label: "Visual & Brand", count: visualRules.length },
  ];

  return (
    <div className="space-y-4">
      {/* Google Workspace Pill Segmented Control */}
      <div className="inline-flex p-1.5 rounded-full bg-[#E9EEF6] gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-[#0B57D0] shadow-sm"
                  : "text-[#444746] hover:text-[#1F1F1F]"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Rule Cards */}
      <div className="space-y-3">
        {activeTab === "fixes" && failedRules.length === 0 ? (
          <div className="p-6 text-center bg-[#C4EED0]/60 rounded-3xl text-[#072711] text-sm font-medium">
            Zero rubric violations detected. This campaign passes all brand and
            best-practice checks.
          </div>
        ) : (
          displayedRules.map((rule) => (
            <RuleCard key={rule.ruleId} rule={rule} />
          ))
        )}
      </div>
    </div>
  );
}

function RuleCard({
  rule,
}: {
  rule: FinalAuditReport["evaluations"][number];
}) {
  return (
    <div
      className={`p-5 rounded-3xl transition-all ${
        rule.passed
          ? "bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          : "bg-[#F9DEDC]/45"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {rule.passed ? (
            <CheckCircle2 className="w-5 h-5 text-[#146C2E] shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-[#B3261E] shrink-0" />
          )}
          <h4 className="text-sm font-medium text-[#1F1F1F]">
            {rule.ruleTitle}
          </h4>
        </div>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F0F4F9] text-[#444746]">
          {rule.passed ? `+${rule.weight} pts` : `0 / ${rule.weight} pts`}
        </span>
      </div>

      <p className="text-sm text-[#444746] mt-2.5 leading-relaxed">
        {rule.finding}
      </p>

      <div className="mt-3 text-xs bg-[#F0F4F9] px-3.5 py-2.5 rounded-2xl text-[#444746]">
        <strong className="font-medium text-[#1F1F1F]">Evidence:</strong>{" "}
        {rule.evidence}
      </div>

      {!rule.passed && rule.suggestedFix && (
        <div className="mt-2.5 text-xs bg-white px-3.5 py-3 rounded-2xl text-[#1F1F1F] flex items-start gap-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <Wrench className="w-4 h-4 text-[#B3261E] shrink-0 mt-0.5" />
          <div>
            <strong className="font-medium text-[#B3261E]">
              Recommended Fix:
            </strong>{" "}
            {rule.suggestedFix}
          </div>
        </div>
      )}
    </div>
  );
}
