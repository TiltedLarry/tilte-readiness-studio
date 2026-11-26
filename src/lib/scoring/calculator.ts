import {
  EMAIL_BEST_PRACTICES_RUBRIC,
  type RubricRuleDefinition,
} from "./rubric";
import type {
  CopyAuditOutput,
  FinalAuditReport,
  InboxSimulationOutput,
  RuleEvaluation,
  VisualAuditOutput,
} from "@/lib/schemas/audit.schema";

export function buildFinalAuditReport(params: {
  campaignId: string;
  copyAudit: CopyAuditOutput;
  visualAudit?: VisualAuditOutput | null;
  inboxSimulation: InboxSimulationOutput;
  rubric?: RubricRuleDefinition[];
}): FinalAuditReport {
  const {
    campaignId,
    copyAudit,
    visualAudit,
    inboxSimulation,
    rubric = EMAIL_BEST_PRACTICES_RUBRIC,
  } = params;

  const activeRules = rubric.filter((r) => r.enabled !== false);

  const copyMap = new Map<string, RuleEvaluation>(
    copyAudit.evaluations.map((ev) => [ev.ruleId, ev])
  );
  const visualMap = new Map<string, RuleEvaluation>(
    (visualAudit?.evaluations ?? []).map((ev) => [ev.ruleId, ev])
  );

  let blockerFailed = false;
  let criticalFailed = false;

  const evaluations = activeRules.map((rule) => {
    const sourceMap = rule.pipeline === "copy" ? copyMap : visualMap;
    const found = sourceMap.get(rule.ruleId);

    const evaluation: RuleEvaluation = found ?? {
      ruleId: rule.ruleId,
      passed: false,
      severity: rule.pipeline === "visual" && !visualAudit ? "info" : "warning",
      finding:
        rule.pipeline === "visual" && !visualAudit
          ? "No design PNG uploaded for visual audit."
          : `No evaluation returned for rule ${rule.ruleId}.`,
      evidence: "N/A",
      suggestedFix:
        rule.pipeline === "visual" && !visualAudit
          ? "Upload a Figma PNG export to verify visual compliance."
          : "Re-run the audit to evaluate this rule.",
    };

    if (!evaluation.passed) {
      if (rule.isBlocker) blockerFailed = true;
      if (evaluation.severity === "critical") criticalFailed = true;
    }

    return {
      ...evaluation,
      category: rule.category,
      weight: rule.weight,
      ruleTitle: rule.ruleTitle,
    };
  });

  const computeCategoryScore = (category: "copy" | "visual" | "compliance") => {
    const items = evaluations.filter((e) => e.category === category);
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return 100;
    const earnedWeight = items.reduce(
      (sum, item) => sum + (item.passed ? item.weight : 0),
      0
    );
    return Math.round((earnedWeight / totalWeight) * 100);
  };

  const totalWeight = evaluations.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = evaluations.reduce(
    (sum, item) => sum + (item.passed ? item.weight : 0),
    0
  );
  const overallScore =
    totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  let readinessStatus: FinalAuditReport["readinessStatus"] = "NEEDS_REVISION";
  if (blockerFailed) {
    readinessStatus = "BLOCKED";
  } else if (overallScore >= 85 && !criticalFailed) {
    readinessStatus = "READY_TO_SEND";
  }

  return {
    campaignId,
    createdAt: new Date().toISOString(),
    overallScore,
    readinessStatus,
    categoryScores: {
      copyAndAlignment: computeCategoryScore("copy"),
      visualAndBrand: computeCategoryScore("visual"),
      complianceAndDeliverability: computeCategoryScore("compliance"),
    },
    inboxSimulation,
    evaluations,
  };
}
