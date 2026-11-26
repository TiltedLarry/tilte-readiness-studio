"use client";

import React, { useEffect, useState } from "react";
import { X, SlidersHorizontal, Plus, Save, Loader2, Trash2 } from "lucide-react";
import type { RubricRuleDefinition } from "@/lib/scoring/rubric";

interface BestPracticesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  getIdToken: () => Promise<string | null>;
}

export function BestPracticesDrawer({
  isOpen,
  onClose,
  getIdToken,
}: BestPracticesDrawerProps) {
  const [rules, setRules] = useState<RubricRuleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    (async () => {
      await Promise.resolve();
      if (!active) return;
      setIsLoading(true);
      setError(null);
      setStatusMessage(null);

      try {
        const res = await fetch("/api/best-practices");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load rules.");
        if (active) setRules((data.rules as RubricRuleDefinition[]) || []);
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Failed to load rules.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const updateRule = (
    index: number,
    patch: Partial<RubricRuleDefinition>
  ) => {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    );
  };

  const addNewRule = () => {
    setRules((prev) => [
      ...prev,
      {
        ruleId: `CUSTOM_RULE_${Date.now()}`,
        ruleTitle: "New Best Practice Rule",
        category: "copy",
        pipeline: "copy",
        weight: 5,
        criteria: "Describe the exact requirement this email must satisfy.",
        isBlocker: false,
        enabled: true,
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      const token = await getIdToken();
      const res = await fetch("/api/best-practices", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rules }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save rules.");
      setStatusMessage("Platform best practices saved to Firestore.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalEnabledWeight = rules
    .filter((r) => r.enabled !== false)
    .reduce((sum, r) => sum + Number(r.weight || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex justify-end z-50">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
        <div className="px-6 py-5 bg-[#F0F4F9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-[#0B57D0]" />
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F]">
                Platform Best Practices (Super Admin)
              </h3>
              <p className="text-xs text-[#444746]">
                Active enabled weight total: <strong>{totalEnabledWeight} pts</strong>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 text-sm text-[#B3261E] bg-[#F9DEDC] rounded-2xl">
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="p-3.5 text-sm text-[#072711] bg-[#C4EED0] rounded-2xl">
              {statusMessage}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[#444746] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0B57D0]" />
              Loading platform rubric...
            </div>
          ) : (
            rules.map((rule, idx) => (
              <div
                key={rule.ruleId + idx}
                className="p-4 rounded-2xl bg-[#F8FAFD] space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={rule.ruleTitle}
                    onChange={(e) =>
                      updateRule(idx, { ruleTitle: e.target.value })
                    }
                    className="flex-1 bg-white rounded-xl px-3 py-2 text-sm font-medium text-[#1F1F1F] outline-none focus:ring-2 focus:ring-[#0B57D0]"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.weight}
                    onChange={(e) =>
                      updateRule(idx, { weight: Number(e.target.value) })
                    }
                    className="w-20 bg-white rounded-xl px-3 py-2 text-sm text-center font-mono text-[#1F1F1F] outline-none focus:ring-2 focus:ring-[#0B57D0]"
                    title="Point weight"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="p-2 text-[#747775] hover:text-[#B3261E] cursor-pointer"
                    title="Delete rule"
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
                  className="w-full bg-white rounded-xl px-3 py-2 text-xs text-[#444746] outline-none focus:ring-2 focus:ring-[#0B57D0] resize-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#444746]">
                  <div className="flex items-center gap-2">
                    <select
                      value={rule.category}
                      onChange={(e) => {
                        const category = e.target.value as
                          | "copy"
                          | "visual"
                          | "compliance";
                        updateRule(idx, {
                          category,
                          pipeline: category === "visual" ? "visual" : "copy",
                        });
                      }}
                      className="bg-white rounded-xl px-2.5 py-1.5 text-xs outline-none"
                    >
                      <option value="copy">Copy</option>
                      <option value="visual">Visual</option>
                      <option value="compliance">Compliance</option>
                    </select>
                    <span className="font-mono text-[11px] text-[#747775]">
                      {rule.ruleId}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(rule.isBlocker)}
                        onChange={(e) =>
                          updateRule(idx, { isBlocker: e.target.checked })
                        }
                      />
                      <span>Blocker</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled !== false}
                        onChange={(e) =>
                          updateRule(idx, { enabled: e.target.checked })
                        }
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 bg-[#F0F4F9] flex items-center justify-between">
          <button
            type="button"
            onClick={addNewRule}
            className="h-10 px-4 rounded-full bg-white hover:bg-[#E9EEF6] text-[#0B57D0] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>

          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={handleSave}
            className="h-11 px-6 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] disabled:opacity-60 text-white text-sm font-medium flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Platform Rubric
          </button>
        </div>
      </div>
    </div>
  );
}
