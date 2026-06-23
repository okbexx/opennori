export type JsonObject = Record<string, any>;

export type AcceptanceStatus = "unknown" | "failing" | "passing" | "blocked" | "waived";

export type WorkflowStatus = "draft" | "active" | "blocked" | "complete";

export type EvidenceResult = "failing" | "passing" | "blocked" | "waived";

export type EvidenceBasis =
  | "human-confirmation"
  | "tool-observation"
  | "artifact-review"
  | "protocol-check"
  | "agent-observation"
  | (string & {});

export type RiskLevel = "low" | "medium" | "high" | (string & {});

export type ContractLanguage = "zh-CN" | "en" | (string & {});

export type ValidationIssue = {
  path: string;
  message: string;
  [key: string]: unknown;
};
