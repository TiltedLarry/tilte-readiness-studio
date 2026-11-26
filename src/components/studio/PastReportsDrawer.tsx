"use client";

import React, { useEffect, useState } from "react";
import { X, History, Loader2, ArrowUpRight } from "lucide-react";
import type { FinalAuditReport } from "@/lib/schemas/audit.schema";

interface StoredAuditReport extends FinalAuditReport {
  reportId: string;
  campaignName?: string;
  styleGuideId?: string;
}

interface PastReportsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  getIdToken: () => Promise<string | null>;
  onSelectReport: (data: {
    reportId: string;
    campaignId: string;
    styleGuideId: string;
    report: FinalAuditReport;
  }) => void;
}

export function PastReportsDrawer({
  isOpen,
  onClose,
  getIdToken,
  onSelectReport,
}: PastReportsDrawerProps) {
  const [reports, setReports] = useState<StoredAuditReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    (async () => {
      await Promise.resolve();
      if (!active) return;
      setIsLoading(true);
      setError(null);

      try {
        const token = await getIdToken();
        const res = await fetch("/api/reports", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load reports.");
        if (active) setReports((data.reports as StoredAuditReport[]) || []);
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Unable to load reports.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen, getIdToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex justify-end z-50">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="px-6 py-5 bg-[#F0F4F9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#0B57D0]" />
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F]">
                Past Audit Reports
              </h3>
              <p className="text-xs text-[#444746]">
                Your saved client campaign evaluations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#E1E6EE] flex items-center justify-center text-[#444746] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#444746] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B57D0]" />
              Loading your reports...
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-[#B3261E] bg-[#F9DEDC] rounded-2xl">
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#444746] bg-[#F8FAFD] rounded-3xl">
              No saved reports yet. Run an audit to save your first report.
            </div>
          ) : (
            reports.map((item) => {
              const badgeClass =
                item.readinessStatus === "READY_TO_SEND"
                  ? "bg-[#C4EED0] text-[#072711]"
                  : item.readinessStatus === "NEEDS_REVISION"
                  ? "bg-[#FEEFC3] text-[#3F2E00]"
                  : "bg-[#F9DEDC] text-[#410E0B]";

              return (
                <button
                  key={item.reportId}
                  type="button"
                  onClick={() => {
                    onSelectReport({
                      reportId: item.reportId,
                      campaignId: item.campaignId,
                      styleGuideId: item.styleGuideId || "",
                      report: item,
                    });
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-[#F8FAFD] hover:bg-[#EDF2FA] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1F1F1F] truncate">
                      {item.campaignName || `Campaign ${item.campaignId.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-[#444746] mt-0.5">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}
                    >
                      {item.overallScore}/100
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#0B57D0]" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
