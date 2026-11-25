import type { FinalAuditReport } from "@/lib/schemas/audit.schema";
import type { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";

export interface CampaignSummary {
  id: string;
  name: string;
  clientName: string;
  updatedAt: string;
  latestScore: number | null;
}

export interface StudioWorkspaceState {
  campaignId: string;
  subjectLine: string;
  preHeader: string;
  emailCopy: string;
  styleGuideId?: string;
  pngPreviewUrl?: string;
  report: FinalAuditReport | null;
  isAuditing: boolean;
}

export type { FinalAuditReport, StyleGuideProfile };
