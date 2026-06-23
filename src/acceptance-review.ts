import type { AcceptanceQualityAudit } from "./types/acceptance.ts";

export function reviewAcceptanceQuality(_contract: unknown): AcceptanceQualityAudit {
  return {
    status: "clear",
    summary: "Subjective acceptance quality is reviewed by OpenNori Skills and the user; CLI checks only report objective contract state.",
    findings: []
  };
}

export const auditAcceptanceQuality = reviewAcceptanceQuality;
