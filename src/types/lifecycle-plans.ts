import type { Manifest } from "./manifest.ts";

export type ManagedAction = {
  path: string;
  action: string;
  kind: string;
  managed: boolean;
  reason?: string;
  recursive?: boolean;
  manifest?: Manifest;
  write?: () => unknown;
  from_version?: string;
  to_version?: string;
  [key: string]: unknown;
};

export type LifecyclePlanAction = {
  path: string;
  kind: string;
  action: string;
  managed: boolean;
  would_write: boolean;
  will_write: boolean;
  destructive: boolean;
  recursive?: boolean;
  from_version?: string;
  to_version?: string;
  reason: string;
};

export type LifecyclePlanSummary = {
  total: number;
  by_action: Record<string, number>;
  would_write: number;
  will_write: number;
  destructive: number;
  managed: number;
  preserved?: number;
};

export type InstallPlan = {
  schema_version: "opennori/install-plan-v1";
  root: string;
  dry_run: boolean;
  force: boolean;
  merge_agent_route: boolean;
  summary: LifecyclePlanSummary;
  actions: LifecyclePlanAction[];
};

export type UninstallPlan = {
  schema_version: "opennori/uninstall-plan-v1";
  root: string;
  dry_run: boolean;
  include_state: boolean;
  summary: LifecyclePlanSummary;
  actions: LifecyclePlanAction[];
};

export type UpgradePlan = {
  schema_version: "opennori/upgrade-plan-v1";
  root: string;
  dry_run: boolean;
  merge_agent_route: boolean;
  summary: LifecyclePlanSummary;
  actions: LifecyclePlanAction[];
};

export type ManifestWriteAction = ManagedAction & {
  manifest: Manifest;
};
