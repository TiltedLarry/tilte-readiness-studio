"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  History,
  ShieldCheck,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import { auth, SUPER_ADMIN_EMAIL } from "@/lib/firebase/client";
import { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import { FinalAuditReport } from "@/lib/schemas/audit.schema";
import { SplitAuthScreen } from "@/components/auth/SplitAuthScreen";
import { StudioWorkspace } from "./StudioWorkspace";
import { BestPracticesDrawer } from "@/components/admin/BestPracticesDrawer";

interface SavedReportSummary {
  reportId: string;
  campaignId: string;
  campaignName?: string;
  thumbnailDataUrl?: string;
  styleGuideId: string;
  overallScore: number;
  readinessStatus: FinalAuditReport["readinessStatus"];
  createdAt: string;
  report?: FinalAuditReport;
}

export function AuthenticatedStudioApp({
  styleGuides,
}: {
  styleGuides: StyleGuideProfile[];
}) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReportSummary[]>([]);
  const [selectedPastAudit, setSelectedPastAudit] = useState<{
    reportId: string;
    campaignId: string;
    styleGuideId: string;
    report: FinalAuditReport;
  } | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const safetyTimer = setTimeout(() => {
      setAuthReady(true);
    }, 2500);

    try {
      unsub = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          clearTimeout(safetyTimer);
          setUser(firebaseUser);
          setAuthReady(true);
        },
        () => {
          clearTimeout(safetyTimer);
          setAuthReady(true);
        }
      );
    } catch {
      clearTimeout(safetyTimer);
      Promise.resolve().then(() => setAuthReady(true));
    }
    return () => {
      clearTimeout(safetyTimer);
      if (unsub) unsub();
    };
  }, []);

  const loadHistory = async () => {
    setIsHistoryOpen(true);
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/reports", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.reports) setSavedReports(data.reports);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFD]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B57D0]" />
      </div>
    );
  }

  if (!user) {
    return <SplitAuthScreen />;
  }

  const isSuperAdmin = user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;

  return (
    <main className="min-h-screen flex flex-col bg-[#F8FAFD] text-[#1F1F1F]">
      {/* Clean Header — Badge Removed, Role-Aware Controls Added */}
      <header className="sticky top-0 z-30 h-18 bg-[#F8FAFD]/90 backdrop-blur-md">
        <div className="max-w-[1440px] w-full h-full mx-auto px-6 sm:px-10 lg:px-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <Image
            src="/studio-icon.svg"
            alt="Email Campaign Readiness Studio"
            width={36}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
          <h1 className="font-medium text-base text-[#1F1F1F] tracking-tight">
            Email Campaign Readiness Studio
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Account Manager Saved Reports */}
          <button
            type="button"
            onClick={loadHistory}
            className="h-10 px-4 rounded-full bg-[#F0F4F9] hover:bg-[#E9EEF6] text-[#1F1F1F] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#0B57D0]" />
            <span>Client Reports</span>
          </button>

          {/* Super Admin Best Practices Button (larry.moyo@tilte.cx only) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="h-10 px-4 rounded-full bg-[#C2E7FF] hover:bg-[#B3D7EF] text-[#001D35] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0B57D0]" />
              <span>Best Practices</span>
            </button>
          )}

          {/* Signed-in User Pill & Sign Out */}
          <div className="hidden sm:flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-white text-xs text-[#444746]">
            <span className="truncate max-w-[160px]">{user.email}</span>
            <button
              type="button"
              onClick={() => signOut(auth)}
              title="Sign out"
              className="w-8 h-8 rounded-full hover:bg-[#F0F4F9] flex items-center justify-center text-[#444746] hover:text-[#B3261E] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        </div>
      </header>

      <div className="flex-1 px-6 sm:px-10 lg:px-14 pt-6 pb-16 max-w-[1440px] w-full mx-auto">
        <StudioWorkspace
          styleGuides={styleGuides}
          externalAudit={selectedPastAudit}
        />
      </div>

      {/* Account Manager Saved Reports Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            <div className="px-6 py-5 bg-[#F0F4F9] flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium text-[#1F1F1F]">
                  Saved Client Reports
                </h2>
                <p className="text-xs text-[#444746]">
                  Select a past audit to review its score and findings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-[#E1E6EE] flex items-center justify-center text-[#444746] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {savedReports.length === 0 ? (
                <p className="text-sm text-[#444746] text-center py-12">
                  No saved audits yet. Run your first campaign check to save it
                  here.
                </p>
              ) : (
                savedReports.map((item) => (
                  <button
                    key={item.reportId}
                    type="button"
                    onClick={() => {
                      const fullReport = (item.report ||
                        item) as unknown as FinalAuditReport;
                      setSelectedPastAudit({
                        reportId: item.reportId,
                        campaignId: item.campaignId,
                        styleGuideId: item.styleGuideId,
                        report: fullReport,
                      });
                      setIsHistoryOpen(false);
                    }}
                    className="w-full text-left p-4 rounded-2xl bg-[#F0F4F9] hover:bg-[#E9EEF6] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.thumbnailDataUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.thumbnailDataUrl}
                          alt={item.campaignName || "Campaign thumbnail"}
                          className="w-10 h-12 object-cover object-top rounded-xl bg-white shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1F1F1F] truncate">
                          {item.campaignName ||
                            `Campaign ${item.campaignId.slice(0, 6)}`}
                        </p>
                        <p className="text-xs text-[#444746] mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-[#0B57D0]">
                      {item.overallScore} / 100
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Best Practices Drawer */}
      {isSuperAdmin && (
        <BestPracticesDrawer
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </main>
  );
}
