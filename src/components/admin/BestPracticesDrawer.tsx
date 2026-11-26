"use client";

import React, { useEffect, useState } from "react";
import { X, Plus, Trash2, Save, Loader2, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import type { RubricRuleDefinition } from "@/lib/scoring/rubric";

export function BestPracticesDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [rules, setRules] = useState<RubricRuleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    (async () => {
      await Promise.resolve();
      if (!active) return;
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/rubric");
        const data = await res.json();
        if (active) setRules(data.rules || []);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalWeight = rules.reduce((sum, r) => sum + Number(r.weight || 0), 0);

  const updateRule = (
    index: number,
    patch: Partial<RubricRuleDefinition>
  ) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        ruleId: `CUSTOM_RULE_${Date.now().toString().slice(-4)}`,
        category: "copy",
        pipeline: "copy",
        ruleTitle: "New Best Practice Rule",
        weight: 5,
        criteria: "Describe the exact condition required to pass this rule.",
        enabled: true,
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/rubric", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rules }),
      });

      if (!res.ok) throw new Error("Failed to save rules.");
      setStatusMsg("Platform best practices updated.");
      setTimeout(() => setStatusMsg(null), 2500);
    } catch {
      setStatusMsg("Error saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex justify-end z-50">
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 bg-[#F0F4F9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#0B57D0]" />
            <div>
              <h2 className="text-base font-medium text-[#1F1F1F]">
                Platform Best Practices (Super Admin)
              </h2>
              <p className="text-xs text-[#444746]">
                Configure the evaluation rules and point weights governing all
                audits.
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

        {/* Weight Summary Bar */}
        <div className="px-6 py-3 bg-[#F8FAFD] flex items-center justify-between text-xs">
          <span className="text-[#444746]">
            Active Rules: <strong>{rules.length}</strong>
          </span>
          <span
            className={`px-3 py-1 rounded-full font-medium ${
              totalWeight === 100
                ? "bg-[#C4EED0] text-[#072711]"
                : "bg-[#FEEFC3] text-[#3F2E00]"
            }`}
          >
            Total Weight: {totalWeight} / 100 pts
          </span>
        </div>

        {/* Rules Editor */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-[#444746] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B57D0]" />
              Loading platform rules...
            </div>
          ) : (
            rules.map((rule, idx) => (
              <div
                key={rule.ruleId}
                className="p-4 rounded-3xl bg-[#F0F4F9] space-y-3"
              >
                <div className="grid grid-cols-12 gap-2.5 items-center">
                  <input
                    type="text"
                    value={rule.ruleTitle}
                    onChange={(e) =>
                      updateRule(idx, { ruleTitle: e.target.value })
                    }
                    className="col-span-6 bg-white rounded-2xl px-3.5 py-2 text-sm font-medium text-[#1F1F1F] border-0 outline-none focus:ring-2 focus:ring-[#0B57D0]"
                  />

                  <select
                    value={rule.category}
                    onChange={(e) => {
                      const category = e.target.value as RubricRuleDefinition["category"];
                      updateRule(idx, {
                        category,
                        pipeline: category === "visual" ? "visual" : "copy",
                      });
                    }}
                    className="col-span-3 bg-white rounded-2xl px-3 py-2 text-xs text-[#1F1F1F] border-0 outline-none"
                  >
                    <option value="copy">Copy</option>
                    <option value="visual">Visual</option>
                    <option value="compliance">Compliance</option>
                  </select>

                  <div className="col-span-2 flex items-center bg-white rounded-2xl px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={rule.weight}
                      onChange={(e) =>
                        updateRule(idx, { weight: Number(e.target.value) })
                      }
                      className="w-full text-xs font-medium text-[#1F1F1F] border-0 outline-none"
                    />
                    <span className="text-[11px] text-[#747775]">pts</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="col-span-1 flex justify-center text-[#747775] hover:text-[#B3261E] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={rule.criteria}
                  onChange={(e) =>
                    updateRule(idx, { criteria: e.target.value })
                  }
                  className="w-full bg-white rounded-2xl px-3.5 py-2.5 text-xs text-[#444746] border-0 outline-none focus:ring-2 focus:ring-[#0B57D0] resize-none"
                />
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={addRule}
            className="h-11 px-5 rounded-full bg-[#F0F4F9] hover:bg-[#E9EEF6] text-[#0B57D0] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>

          <div className="flex items-center gap-3">
            {statusMsg && (
              <span className="text-xs font-medium text-[#146C2E]">
                {statusMsg}
              </span>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="h-11 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-sm font-medium flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Best Practices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
