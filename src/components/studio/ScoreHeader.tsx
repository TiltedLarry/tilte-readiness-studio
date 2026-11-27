"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
} from "lucide-react";
import { FinalAuditReport } from "@/lib/schemas/audit.schema";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function ScoreHeader({ report }: { report: FinalAuditReport }) {
  const statusConfig = {
    READY_TO_SEND: {
      label: "Ready to Send",
      pillClass: "bg-[#C4EED0] text-[#072711]",
      scoreColor: "text-[#146C2E]",
      hexBg: "#C4EED0",
      hexText: "#072711",
      Icon: CheckCircle2,
    },
    NEEDS_REVISION: {
      label: "Needs Revision",
      pillClass: "bg-[#FEEFC3] text-[#3F2E00]",
      scoreColor: "text-[#B06000]",
      hexBg: "#FEEFC3",
      hexText: "#3F2E00",
      Icon: AlertTriangle,
    },
    BLOCKED: {
      label: "Blocked — Fix Critical Issues",
      pillClass: "bg-[#F9DEDC] text-[#410E0B]",
      scoreColor: "text-[#B3261E]",
      hexBg: "#F9DEDC",
      hexText: "#410E0B",
      Icon: XCircle,
    },
  }[report.readinessStatus];

  const StatusIcon = statusConfig.Icon;

  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank", "width=960,height=800");
    if (!printWindow) {
      alert("Please allow pop-ups to generate the PDF report.");
      return;
    }

    const failedRules = report.evaluations.filter((e) => !e.passed);
    const passedRules = report.evaluations.filter((e) => e.passed);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.campaignName || "Campaign")} — Readiness Audit Report</title>
  <style>
    @page { margin: 18mm; size: A4; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { color: #1F1F1F; margin: 0; padding: 0; line-height: 1.5; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #F0F4F9; padding-bottom: 18px; margin-bottom: 20px; }
    .brand-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0B57D0; margin-bottom: 4px; }
    h1 { font-size: 22px; margin: 0 0 4px 0; font-weight: 600; }
    .meta { font-size: 12px; color: #5F6368; }
    .score-box { display: flex; align-items: center; gap: 16px; background: #F8FAFD; padding: 18px 22px; border-radius: 16px; margin-bottom: 20px; }
    .thumb { width: 56px; height: 76px; object-fit: cover; object-position: top; border-radius: 10px; border: 1px solid #E1E6EE; }
    .score-num { font-size: 38px; font-weight: 700; color: ${statusConfig.hexText}; line-height: 1; }
    .status-pill { display: inline-block; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; background: ${statusConfig.hexBg}; color: ${statusConfig.hexText}; margin-left: auto; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
    .metric-card { background: #F0F4F9; padding: 12px 16px; border-radius: 12px; }
    .metric-label { font-size: 11px; color: #444746; font-weight: 600; }
    .metric-val { font-size: 18px; font-weight: 700; color: #1F1F1F; margin-top: 2px; }
    .inbox-box { background: #EDF2FA; padding: 16px; border-radius: 14px; margin-bottom: 24px; }
    .inbox-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #0B57D0; margin-bottom: 6px; }
    h2 { font-size: 15px; font-weight: 600; margin: 22px 0 10px 0; color: #1F1F1F; }
    .rule-card { border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; page-break-inside: avoid; }
    .rule-fail { background: #FDF3F2; border-left: 4px solid #B3261E; }
    .rule-pass { background: #F8FAFD; border-left: 4px solid #146C2E; }
    .rule-head { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 4px; }
    .evidence { font-size: 12px; color: #444746; background: rgba(255,255,255,0.75); padding: 6px 10px; border-radius: 8px; margin-top: 6px; }
    .fix { font-size: 12px; color: #1F1F1F; margin-top: 6px; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #E1E6EE; font-size: 11px; color: #747775; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-tag">TILTE • Email Campaign Readiness Studio</div>
      <h1>${escapeHtml(report.campaignName || "Campaign Readiness Audit")}</h1>
      <div class="meta">Generated ${new Date(report.createdAt).toLocaleString()} • Report ID: ${escapeHtml(report.campaignId)}</div>
    </div>
  </div>

  <div class="score-box">
    ${report.thumbnailDataUrl ? `<img src="${report.thumbnailDataUrl}" class="thumb" />` : ""}
    <div>
      <div style="font-size:11px;color:#5F6368;font-weight:600;">OVERALL READINESS SCORE</div>
      <div><span class="score-num">${report.overallScore}</span> <span style="color:#747775;font-size:15px;">/ 100</span></div>
    </div>
    <div class="status-pill">${escapeHtml(statusConfig.label)}</div>
  </div>

  <div class="metrics">
    <div class="metric-card">
      <div class="metric-label">Copy & Alignment</div>
      <div class="metric-val">${report.categoryScores.copyAndAlignment}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Visual & Brand</div>
      <div class="metric-val">${report.categoryScores.visualAndBrand}%</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Compliance</div>
      <div class="metric-val">${report.categoryScores.complianceAndDeliverability}%</div>
    </div>
  </div>

  <div class="inbox-box">
    <div class="inbox-title">Simulated Inbox AI Summary (${escapeHtml(report.inboxSimulation.summarySentiment)})</div>
    <div style="font-weight:500;margin-bottom:6px;">“${escapeHtml(report.inboxSimulation.appleMailAiSummary)}”</div>
    <div style="font-size:12px;color:#444746;"><strong>Critique:</strong> ${escapeHtml(report.inboxSimulation.summaryCritique)}</div>
    <div style="font-size:11px;color:#5F6368;margin-top:8px;">
      <strong>Mobile (35c):</strong> ${escapeHtml(report.inboxSimulation.mobileSubjectTruncated)} &nbsp;|&nbsp;
      <strong>Desktop (60c):</strong> ${escapeHtml(report.inboxSimulation.desktopSubjectTruncated)}
    </div>
  </div>

  <h2>Actionable Fixes Required (${failedRules.length})</h2>
  ${
    failedRules.length === 0
      ? `<p style="color:#146C2E;">No violations detected. All brand and best-practice checks passed.</p>`
      : failedRules
          .map(
            (r) => `
    <div class="rule-card rule-fail">
      <div class="rule-head">
        <span>✕ ${escapeHtml(r.ruleTitle)}</span>
        <span>0 / ${r.weight} pts</span>
      </div>
      <div>${escapeHtml(r.finding)}</div>
      <div class="evidence"><strong>Evidence:</strong> ${escapeHtml(r.evidence)}</div>
      <div class="fix"><strong style="color:#B3261E;">Recommended Fix:</strong> ${escapeHtml(r.suggestedFix)}</div>
    </div>`
          )
          .join("")
  }

  <h2>Passed Checks (${passedRules.length})</h2>
  ${passedRules
    .map(
      (r) => `
    <div class="rule-card rule-pass">
      <div class="rule-head">
        <span>✓ ${escapeHtml(r.ruleTitle)}</span>
        <span>+${r.weight} pts</span>
      </div>
      <div style="font-size:12px;color:#444746;">${escapeHtml(r.finding)}</div>
    </div>`
    )
    .join("")}

  <div class="footer">
    <span>TILTE Email Campaign Readiness Studio</span>
    <span>Confidential — Client Pre-Flight QA Report</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
        <div className="flex items-center gap-4">
          {report.thumbnailDataUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={report.thumbnailDataUrl}
              alt={report.campaignName || "Figma layout thumbnail"}
              className="w-14 h-20 object-cover object-top rounded-2xl bg-[#F0F4F9] shrink-0 shadow-xs"
            />
          )}

          <div>
            {report.campaignName && (
              <p className="text-sm font-medium text-[#1F1F1F] mb-0.5">
                {report.campaignName}
              </p>
            )}
            <span className="text-xs font-medium text-[#444746]">
              Readiness Score
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-5xl font-normal tracking-tight ${statusConfig.scoreColor}`}
              >
                {report.overallScore}
              </span>
              <span className="text-base text-[#747775]">/ 100</span>
            </div>
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
            onClick={handleExportPdf}
            className="h-11 px-5 rounded-full bg-[#C2E7FF] hover:bg-[#B3D7EF] text-[#001D35] text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
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
