"use client";

import React, { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";

interface StyleGuideUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuidesUploaded: (newGuides: StyleGuideProfile[]) => void;
}

const EXTRACTION_STAGES = [
  { threshold: 0, label: "Reading Corporate CI document..." },
  { threshold: 25, label: "Loading brand colors & hex relationships..." },
  { threshold: 52, label: "Extracting logo placement & contrast rules..." },
  { threshold: 76, label: "Parsing imagery & gradient construction..." },
  { threshold: 90, label: "Validating structured brand profile..." },
];

export function StyleGuideUploaderModal({
  isOpen,
  onClose,
  onGuidesUploaded,
}: StyleGuideUploaderModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<StyleGuideProfile[]>([]);
  const [step, setStep] = useState<"select" | "review">("select");

  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Smooth simulated progress curve while waiting on Gemini extraction
  useEffect(() => {
    if (!isExtracting) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return 94; // Hold at 94% until server responds
        const increment = prev < 45 ? 7 : prev < 75 ? 4 : 1.5;
        return Math.min(94, Math.round((prev + increment) * 10) / 10);
      });
    }, 550);

    return () => clearInterval(interval);
  }, [isExtracting]);

  if (!isOpen) return null;

  const currentStageLabel =
    [...EXTRACTION_STAGES]
      .reverse()
      .find((s) => progress >= s.threshold)?.label ||
    "Reading Corporate CI document...";

  const resetAndClose = () => {
    if (isExtracting || isSaving) return;
    setSelectedFiles([]);
    setPreviews([]);
    setStep("select");
    setProgress(0);
    setError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 1: Extract Preview (Does NOT write to Firestore)
  const handleExtractPreview = async () => {
    if (selectedFiles.length === 0) return;
    setIsExtracting(true);
    setProgress(8);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/style-guide/extract", {
        method: "POST",
        body: formData,
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Server returned non-JSON response (${res.status}). Check server logs.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Extraction failed.");
      }

      setProgress(100);
      setPreviews(data.previews || []);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error extracting guides.");
    } finally {
      setIsExtracting(false);
      setProgress(0);
    }
  };

  const updatePreview = (
    index: number,
    updater: (prev: StyleGuideProfile) => StyleGuideProfile
  ) => {
    setPreviews((prev) =>
      prev.map((item, i) => (i === index ? updater(item) : item))
    );
  };

  const discardPreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Step 2: Save Approved Guides to Firestore
  const handleSaveApproved = async () => {
    if (previews.length === 0) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/style-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guides: previews }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Server returned non-JSON response (${res.status}). Check server logs.`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to save approved guides.");
      }

      onGuidesUploaded(data.guides);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving guides.");
    } finally {
      setIsSaving(false);
    }
  };

  const extractHexSwatch = (str: string) => {
    const match = str.match(/#[0-9A-Fa-f]{6}/);
    return match ? match[0] : "#CBD5E1";
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#F0F4F9] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-medium text-[#1F1F1F]">
              {step === "select"
                ? "Upload Client Corporate CI"
                : "Review Extracted Brand Rules"}
            </h3>
            <p className="text-xs text-[#444746] mt-0.5">
              {step === "select"
                ? "Step 1 of 2: Attach PDF, TXT, or Markdown brand guides to preview extracted rules."
                : "Step 2 of 2: Verify colors, logo rules, and imagery guidance before saving."}
            </p>
          </div>
          <button
            type="button"
            disabled={isExtracting || isSaving}
            onClick={resetAndClose}
            className="w-9 h-9 rounded-full hover:bg-[#E1E6EE] disabled:opacity-40 flex items-center justify-center text-[#444746] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 text-sm text-[#B3261E] bg-[#F9DEDC] rounded-2xl">
              {error}
            </div>
          )}

          {step === "select" ? (
            <>
              {isExtracting ? (
                /* Active Extraction Progress Box */
                <div className="w-full h-48 rounded-2xl bg-[#EDF2FA] flex flex-col items-center justify-center p-6 text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-white text-[#0B57D0] flex items-center justify-center shadow-sm">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#1F1F1F]">
                      {currentStageLabel}
                    </p>
                    <p className="text-xs font-medium text-[#0B57D0]">
                      {Math.round(progress)}% complete
                    </p>
                  </div>

                  {/* Google Workspace Linear Progress Pill */}
                  <div className="w-full max-w-xs h-2 bg-[#D3E3FD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B57D0] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                /* Idle File Dropzone */
                <label className="flex flex-col items-center justify-center w-full h-40 rounded-2xl bg-[#F0F4F9] hover:bg-[#E9EEF6] cursor-pointer transition-colors">
                  <div className="w-11 h-11 rounded-full bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-[#1F1F1F]">
                    Select Corporate CI documents
                  </p>
                  <p className="text-xs text-[#444746] mt-0.5">
                    Supports PDF, TXT, and Markdown
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#F8FAFD] text-sm"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-[#0B57D0] shrink-0" />
                        <span className="truncate text-[#1F1F1F]">
                          {file.name}
                        </span>
                      </div>
                      {!isExtracting && (
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-[#747775] hover:text-[#B3261E] p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Step 2: Editable Preview Cards */
            <div className="space-y-4">
              {previews.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#444746]">
                  All previews discarded. Go back to upload another file.
                </div>
              ) : (
                previews.map((guide, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-[#F0F4F9] space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={guide.brandName}
                        onChange={(e) =>
                          updatePreview(idx, (g) => ({
                            ...g,
                            brandName: e.target.value,
                          }))
                        }
                        className="flex-1 bg-white rounded-2xl px-3.5 py-2 text-sm font-medium text-[#1F1F1F] border-0 outline-none focus:ring-2 focus:ring-[#0B57D0]"
                      />
                      <button
                        type="button"
                        onClick={() => discardPreview(idx)}
                        title="Discard this guide"
                        className="px-3 py-2 rounded-full bg-white hover:bg-[#F9DEDC] text-xs font-medium text-[#B3261E] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Discard
                      </button>
                    </div>

                    {/* Extracted Color Swatches */}
                    <div className="bg-white p-3.5 rounded-2xl space-y-2">
                      <span className="text-[11px] font-medium text-[#444746] block">
                        Extracted Brand Colors
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...guide.colors.primaryHex,
                          ...guide.colors.secondaryHex,
                        ].map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8FAFD] text-xs text-[#1F1F1F]"
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                              style={{ backgroundColor: extractHexSwatch(c) }}
                            />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Editable Logo & Image Guidance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-[#444746] px-1">
                          Logo Rules
                        </span>
                        <textarea
                          rows={3}
                          value={guide.logoRules}
                          onChange={(e) =>
                            updatePreview(idx, (g) => ({
                              ...g,
                              logoRules: e.target.value,
                            }))
                          }
                          className="w-full bg-white rounded-2xl p-3 text-xs text-[#1F1F1F] border-0 outline-none focus:ring-2 focus:ring-[#0B57D0] resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-[#444746] px-1">
                          Image &amp; Layout Guidance
                        </span>
                        <textarea
                          rows={3}
                          value={guide.imageGuidance}
                          onChange={(e) =>
                            updatePreview(idx, (g) => ({
                              ...g,
                              imageGuidance: e.target.value,
                            }))
                          }
                          className="w-full bg-white rounded-2xl p-3 text-xs text-[#1F1F1F] border-0 outline-none focus:ring-2 focus:ring-[#0B57D0] resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white flex items-center justify-between gap-3 shrink-0">
          {step === "review" ? (
            <button
              type="button"
              onClick={() => setStep("select")}
              className="h-11 px-5 rounded-full bg-[#F0F4F9] hover:bg-[#E9EEF6] text-xs font-medium text-[#1F1F1F] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Files
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isExtracting || isSaving}
              onClick={resetAndClose}
              className="h-11 px-5 rounded-full text-sm font-medium text-[#0B57D0] hover:bg-[#F0F4F9] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {step === "select" ? (
              <button
                type="button"
                disabled={selectedFiles.length === 0 || isExtracting}
                onClick={handleExtractPreview}
                className="h-11 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting ({Math.round(progress)}%)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Preview ({selectedFiles.length})
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={previews.length === 0 || isSaving}
                onClick={handleSaveApproved}
                className="h-11 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving to Library...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Approved ({previews.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
