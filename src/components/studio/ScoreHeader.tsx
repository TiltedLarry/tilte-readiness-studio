"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Check,
} from "lucide-react";
import { FinalAuditReport } from "@/lib/schemas/audit.schema";

export function ScoreHeader({ report }: { report: FinalAuditReport }) {
  const [exported, setExported] = useState(false);

  const statusConfig = {
    READY_TO_SEND: {
      label: "Ready to Send",
      pillClass: "bg-[#C4EED0] text-[#072711]",
      scoreColor: "text-[#146C2E]",
      Icon: CheckCircle2,
    },
    NEEDS_REVISION: {
      label: "Needs Revision",
      pillClass: "bg-[#FEEFC3] text-[#3F2E00]",
      scoreColor: "text-[#B06000]",
      Icon: AlertTriangle,
    },
    BLOCKED: {
      label: "Blocked — Fix Critical Issues",
      pillClass: "bg-[#F9DEDC] text-[#410E0B]",
      scoreColor: "text-[#B3261E]",
      Icon: XCircle,
    },
  }[report.readinessStatus];

  const StatusIcon = statusConfig.Icon;

  const handleExportMarkdown = () => {
    const failedRules = report.evaluations.filter((e) => !e.passed);
    const passedRules = report.evaluations.filter((e) => e.passed);

    const markdownLines = [
      `# Email Campaign Readiness Audit Report`,
      `**Campaign ID:** \`${report.campaignId}\`  `,
      `**Audit Date:** ${new Date(report.createdAt).toLocaleString()}  `,
      `**Overall Readiness Score:** **${report.overallScore} / 100** (${statusConfig.label})`,
      ``,
      `---`,
      ``,
      `## Category Breakdown`,
      `| Category | Score |`,
      `| :--- | :---: |`,
      `| Copy & Alignment | ${report.categoryScores.copyAndAlignment}% |`,
      `| Visual & Brand | ${report.categoryScores.visualAndBrand}% |`,
      `| Compliance & Deliverability | ${report.categoryScores.complianceAndDeliverability}% |`,
      ``,
      `---`,
      ``,
      `## Inbox AI Summary & Truncation Preview`,
      `> **Simulated Apple Mail / Gmail AI Summary:**  `,
      `> "${report.inboxSimulation.appleMailAiSummary}"`,
      ``,
      `- **Sentiment:** ${report.inboxSimulation.summarySentiment}`,
      `- **AI Critique:** ${report.inboxSimulation.summaryCritique}`,
      `- **Mobile Subject (35 chars):** \`${report.inboxSimulation.mobileSubjectTruncated}\``,
      `- **Desktop Subject (60 chars):** \`${report.inboxSimulation.desktopSubjectTruncated}\``,
      ``,
      `---`,
      ``,
      `## Actionable Fixes Required (${failedRules.length})`,
      ...(failedRules.length === 0
        ? [`No violations found. All rubric checks passed.`]
        : failedRules.flatMap((rule) => [
            `### ❌ ${rule.ruleTitle} (\`0 / ${rule.weight} pts\`)`,
            `- **Finding:** ${rule.finding}`,
            `- **Evidence:** ${rule.evidence}`,
            `- **Recommended Fix:** ${rule.suggestedFix}`,
            ``,
          ])),
      `---`,
      ``,
      `## Passed Rubric Checks (${passedRules.length})`,
      ...passedRules.map(
        (rule) =>
          `- ✅ **${rule.ruleTitle}** (\`+${rule.weight} pts\`) — ${rule.finding}`
      ),
    ];

    const blob = new Blob([markdownLines.join("\n")], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-audit-${report.campaignId.slice(0, 8)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
        <div>
          <span className="text-xs font-medium text-[#444746]">
            Readiness Score
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-5xl font-normal tracking-tight ${statusConfig.scoreColor}`}>
              {report.overallScore}
            </span>
            <span className="text-base text-[#747775]">/ 100</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium ${statusConfig.pillClass}`}
          >
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </div>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="h-11 px-5 rounded-full bg-[#C2E7FF] hover:bg-[#B3D7EF] text-[#001D35] text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            {exported ? (
              <>
                <Check className="w-4 h-4 text-[#146C2E]" />
                Exported
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tonal Category Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CategoryMetric
          label="Copy & Alignment"
          score={report.categoryScores.copyAndAlignment}
        />
        <CategoryMetric
          label="Visual & Brand"
          score={report.categoryScores.visualAndBrand}
        />
        <CategoryMetric
          label="Compliance"
          score={report.categoryScores.complianceAndDeliverability}
        />
      </div>
    </div>
  );
}

function CategoryMetric({ label, score }: { label: string; score: number }) {
  const barColor =
    score >= 85
      ? "bg-[#146C2E]"
      : score >= 60
      ? "bg-[#E37400]"
      : "bg-[#B3261E]";

  return (
    <div className="bg-[#F0F4F9] p-3.5 rounded-2xl">
      <div className="flex justify-between text-xs font-medium text-[#1F1F1F] mb-2">
        <span>{label}</span>
        <span>{score}%</span>
      </div>
      <div className="w-full h-2 bg-[#DCE3EC] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
