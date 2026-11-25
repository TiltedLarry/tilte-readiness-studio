"use client";

import React, { useState } from "react";
import { Upload, FileText, Loader2, X, CheckCircle2 } from "lucide-react";
import { StyleGuideProfile } from "@/lib/schemas/styleGuide.schema";

interface StyleGuideUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuidesUploaded: (newGuides: StyleGuideProfile[]) => void;
}

export function StyleGuideUploaderModal({
  isOpen,
  onClose,
  onGuidesUploaded,
}: StyleGuideUploaderModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/style-guide", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      onGuidesUploaded(data.guides);
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error uploading guides.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-[#1F1F1F]">
              Upload Brand Style Guides
            </h3>
            <p className="text-xs text-[#444746] mt-0.5">
              Drop one or multiple PDF, TXT, or Markdown brand docs to extract
              rules automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#F0F4F9] flex items-center justify-center text-[#444746] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 text-sm text-[#B3261E] bg-[#F9DEDC] rounded-2xl">
            {error}
          </div>
        )}

        {/* Multi-file Dropzone */}
        <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl bg-[#F0F4F9] hover:bg-[#E9EEF6] cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#D3E3FD] text-[#0B57D0] flex items-center justify-center mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-[#1F1F1F]">
            Select multiple style guide files
          </p>
          <p className="text-xs text-[#444746] mt-0.5">
            Supports PDF, TXT, and MD
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Queued Files List */}
        {selectedFiles.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#F8FAFD] text-sm"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-[#0B57D0] shrink-0" />
                  <span className="truncate text-[#1F1F1F]">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-[#747775] hover:text-[#B3261E] p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-full text-sm font-medium text-[#0B57D0] hover:bg-[#F0F4F9] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedFiles.length === 0 || isUploading}
            onClick={handleUpload}
            className="h-11 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting {selectedFiles.length} Guide(s)...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Extract & Save ({selectedFiles.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
