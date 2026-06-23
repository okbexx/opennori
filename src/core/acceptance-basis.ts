import type { NoriContract } from "../types/contract.ts";

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

export function acceptanceBasisView(contract: NoriContract): {
  status: string;
  summary: string | null;
  source: string | null;
  mode: string | null;
  coverage_summary: string[];
  assumptions: string[];
  open_questions: string[];
  out_of_scope: string[];
} {
  const basis = contract.acceptance_basis || { status: "draft" };
  return {
    status: String(basis.status || "draft"),
    summary: basis.summary ? String(basis.summary) : null,
    source: basis.source ? String(basis.source) : null,
    mode: basis.mode ? String(basis.mode) : null,
    coverage_summary: stringList(basis.coverage_summary),
    assumptions: stringList(basis.assumptions),
    open_questions: stringList(basis.open_questions),
    out_of_scope: stringList(basis.out_of_scope)
  };
}
