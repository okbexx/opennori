import type { TechnicalArchitectureBaseline, TechnicalArchitectureFlow, TechnicalArchitectureItem } from "../types/architecture.ts";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function normalizeTechnicalBaseline(input: Partial<TechnicalArchitectureBaseline> | undefined): TechnicalArchitectureBaseline {
  return {
    runtime_topology: asArray<TechnicalArchitectureItem>(input?.runtime_topology),
    source_of_truth: asArray<TechnicalArchitectureItem>(input?.source_of_truth),
    module_boundaries: asArray<TechnicalArchitectureItem>(input?.module_boundaries),
    contract_surfaces: asArray<TechnicalArchitectureItem>(input?.contract_surfaces),
    data_flows: asArray<TechnicalArchitectureFlow>(input?.data_flows),
    dependency_decisions: asArray<TechnicalArchitectureItem>(input?.dependency_decisions),
    reference_mappings: asArray<TechnicalArchitectureItem>(input?.reference_mappings),
    verification: asArray<string>(input?.verification)
  };
}

export function technicalBaselineIsComplete(input: Partial<TechnicalArchitectureBaseline> | undefined, { requireVerification = false } = {}): boolean {
  const baseline = normalizeTechnicalBaseline(input);
  return baseline.runtime_topology.length > 0
    && baseline.source_of_truth.length > 0
    && baseline.module_boundaries.length > 0
    && baseline.contract_surfaces.length > 0
    && baseline.data_flows.length > 0
    && baseline.dependency_decisions.length > 0
    && baseline.reference_mappings.length > 0
    && (!requireVerification || baseline.verification.length > 0);
}
