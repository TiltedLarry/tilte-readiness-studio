"use client";

import React, { useState } from "react";
import {
  Upload,
  Sparkles,
  FileImage,
  Loader2,
  ChevronDown,
  Plus,
} from "lucide-react";
import { FinalAuditReport } from "@/lib/schemas/audit.schema";
import { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";
import { StyleGuideUploaderModal } from "@/components/style-guide/StyleGuideUploaderModal";
import { auth } from "@/lib/firebase/client";

interface CampaignInputFormProps {
  styleGuides: StyleGuideProfile[];
  getIdToken?: () => Promise<string | null>;
  onAuditStart?: () => void;
  onAuditEnd?: () => void;
  onAuditComplete: (data: {
    reportId: string;
    campaignId: string;
    styleGuideId: string;
    report: FinalAuditReport;
  }) => void;
}

async function createCompressedThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const targetWidth = 240;
      const scale = Math.min(1, targetWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas context unavailable"));
        return;
      }

      // Fill white background in case PNG has transparent margins
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for thumbnail"));
    };

    img.src = objectUrl;
  });
}

export function CampaignInputForm({
  styleGuides: initialGuides,
  getIdToken,
  onAuditStart,
  onAuditEnd,
  onAuditComplete,
}: CampaignInputFormProps) {
  const [guidesList, setGuidesList] =
    useState<StyleGuideProfile[]>(initialGuides);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [styleGuideId, setStyleGuideId] = useState(
    initialGuides[0]?.id || ""
  );
  const [subjectLine, setSubjectLine] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyCopy, setBodyCopy] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuidesUploaded = (newGuides: StyleGuideProfile[]) => {
    setGuidesList((prev) => [...prev, ...newGuides]);
    if (newGuides[0]?.id) {
      setStyleGuideId(newGuides[0].id);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!styleGuideId) {
      setError("Please select or upload a Client Corporate CI guide first.");
      return;
    }

    if (!imageFile) {
      setError("Please upload an exported Figma PNG design.");
      return;
    }

    setIsSubmitting(true);
    onAuditStart?.();
    try {
      const thumbnailDataUrl = await createCompressedThumbnail(imageFile);

      const formData = new FormData();
      formData.append("campaignName", campaignName);
      formData.append("styleGuideId", styleGuideId);
      formData.append("subjectLine", subjectLine);
      formData.append("previewText", previewText);
      formData.append("bodyCopy", bodyCopy);
      formData.append("designImage", imageFile);
      formData.append("thumbnailDataUrl", thumbnailDataUrl);

      const token =
        (getIdToken ? await getIdToken() : null) ??
        (await auth.currentUser?.getIdToken()) ??
        null;
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Server returned non-JSON response (${res.status}). Check terminal logs for details.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Audit failed.");
      }

      onAuditComplete({
        reportId: data.reportId,
        campaignId: data.campaignId,
        styleGuideId,
        report: data.report,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
      onAuditEnd?.();
    }
  };

  const inputBaseClass =
    "w-full bg-[#F0F4F9] hover:bg-[#E9EEF6] focus:bg-white text-[#1F1F1F] placeholder:text-[#747775] text-sm rounded-2xl px-4 py-3 border-0 outline-none focus:ring-2 focus:ring-[#0B57D0] transition-all";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white rounded-3xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] space-y-5"
      >
        <div>
          <h2 className="text-lg font-medium text-[#1F1F1F]">
            Campaign Details
          </h2>
          <p className="text-xs text-[#444746] mt-0.5">
            Enter copy, select the client Corporate CI, and attach your Figma
            export.
          </p>
        </div>

        {error && (
          <div className="p-3.5 text-sm text-[#B3261E] bg-[#F9DEDC] rounded-2xl">
            {error}
          </div>
        )}

        {/* Full-Width Row: Campaign Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="campaignName"
            className="block text-xs font-medium text-[#444746] px-1"
          >
            Campaign Name
          </label>
          <input
            id="campaignName"
            type="text"
            placeholder="e.g., Sanlam Wealth Q4 Rewards Launch"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className={inputBaseClass}
            required
          />
        </div>

        {/* Subject Line */}
        <div className="space-y-1.5">
          <div className="flex justify-between px-1">
            <label
              htmlFor="subjectLine"
              className="text-xs font-medium text-[#444746]"
            >
              Subject Line
            </label>
            <span className="text-xs text-[#747775]">
              {subjectLine.length} chars
            </span>
          </div>
          <input
            id="subjectLine"
            type="text"
            placeholder="Your Q4 portfolio review is ready..."
            value={subjectLine}
            onChange={(e) => setSubjectLine(e.target.value)}
            className={inputBaseClass}
            required
          />
        </div>

        {/* Preview Text */}
        <div className="space-y-1.5">
          <label
            htmlFor="previewText"
            className="block text-xs font-medium text-[#444746] px-1"
          >
            Preview / Preheader Text
          </label>
          <input
            id="previewText"
            type="text"
            placeholder="See your updated benefits and coverage summary."
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className={inputBaseClass}
          />
        </div>

        {/* Body Copy */}
        <div className="space-y-1.5">
          <label
            htmlFor="bodyCopy"
            className="block text-xs font-medium text-[#444746] px-1"
          >
            Email Body Copy
          </label>
          <textarea
            id="bodyCopy"
            rows={5}
            placeholder="Paste the full email copy including headlines, paragraphs, CTA button text, and footer..."
            value={bodyCopy}
            onChange={(e) => setBodyCopy(e.target.value)}
            className={`${inputBaseClass} resize-none leading-relaxed`}
            required
          />
        </div>

        {/* Two-Column Row Above Figma Export: Client CI Selector + Upload Button */}
        <div className="space-y-1.5">
          <label
            htmlFor="styleGuide"
            className="block text-xs font-medium text-[#444746] px-1"
          >
            Client Corporate CI / Brand Guide
          </label>

          <div className="grid grid-cols-12 gap-2.5 items-center">
            <div className="col-span-8 relative">
              <select
                id="styleGuide"
                value={styleGuideId}
                onChange={(e) => setStyleGuideId(e.target.value)}
                className={`${inputBaseClass} appearance-none pr-10 cursor-pointer`}
                required
              >
                <option value="" disabled>
                  {guidesList.length === 0
                    ? "No Client CI uploaded yet..."
                    : "Select Client CI (e.g., Sanlam, Nedbank)..."}
                </option>
                {guidesList.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.brandName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#444746] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="col-span-4">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full h-[44px] px-4 rounded-full bg-[#C2E7FF] hover:bg-[#B3D7EF] text-[#001D35] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>New Guide</span>
              </button>
            </div>
          </div>
        </div>

        {/* Figma Design Export */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-[#444746] px-1">
            Figma Design Export (PNG / JPG)
          </span>
          <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl cursor-pointer bg-[#F0F4F9] hover:bg-[#E9EEF6] transition-colors overflow-hidden relative">
            {imagePreviewUrl ? (
              <div className="flex items-center gap-4 p-4 w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Figma preview"
                  className="h-full w-24 object-cover object-top rounded-xl shadow-sm"
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-[#1F1F1F] flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-[#0B57D0]" />
                    {imageFile?.name}
                  </p>
                  <p className="text-xs text-[#444746] mt-1">
                    Click anywhere to replace export
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-5">
                <div className="w-10 h-10 rounded-full bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-[#1F1F1F]">
                  Upload Figma frame PNG
                </p>
                <p className="text-xs text-[#444746] mt-0.5">
                  1x or 2x export (max 10MB)
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] active:scale-[0.99] disabled:opacity-60 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Readiness Audit...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Run Readiness Audit
            </>
          )}
        </button>
      </form>

      <StyleGuideUploaderModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onGuidesUploaded={handleGuidesUploaded}
      />
    </>
  );
}
