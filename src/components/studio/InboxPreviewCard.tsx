import React from "react";
import { Smartphone, Monitor, Sparkles } from "lucide-react";
import { InboxSimulationOutput } from "@/lib/schemas/audit.schema";

export function InboxPreviewCard({
  simulation,
}: {
  simulation: InboxSimulationOutput;
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-[#1F1F1F] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0B57D0]" />
          Inbox AI Summary & Truncation Preview
        </h3>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F0F4F9] text-[#444746] capitalize">
          Tone: {simulation.summarySentiment}
        </span>
      </div>

      {/* Gemini-tinted summary container */}
      <div className="p-4 rounded-2xl bg-[#EDF2FA]">
        <div className="text-xs font-medium text-[#0B57D0] mb-1">
          Apple Mail / Gmail AI Notification Summary
        </div>
        <p className="text-sm text-[#1F1F1F] leading-relaxed">
          “{simulation.appleMailAiSummary}”
        </p>
        <p className="text-xs text-[#444746] mt-2.5 pt-2.5 border-t border-[#D3E3FD]">
          <strong className="font-medium text-[#1F1F1F]">Critique:</strong>{" "}
          {simulation.summaryCritique}
        </p>
      </div>

      {/* Borderless Truncation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-[#F0F4F9]">
          <div className="flex items-center gap-1.5 text-[#444746] font-medium mb-1">
            <Smartphone className="w-3.5 h-3.5" /> Mobile (35 chars)
          </div>
          <p className="font-mono text-[#1F1F1F] truncate">
            {simulation.mobileSubjectTruncated}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F0F4F9]">
          <div className="flex items-center gap-1.5 text-[#444746] font-medium mb-1">
            <Monitor className="w-3.5 h-3.5" /> Desktop (60 chars)
          </div>
          <p className="font-mono text-[#1F1F1F] truncate">
            {simulation.desktopSubjectTruncated}
          </p>
        </div>
      </div>
    </div>
  );
}
