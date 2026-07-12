import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { asOpenNoriError, OpenNoriError } from "./errors.ts";
import { withExclusiveLock, withProjectRuntimeLock } from "./exclusive-lock.ts";
import {
  contentHash,
  normalizeText,
  nowIso,
  posixRelative,
  readJson,
  readText,
  safeProjectPath,
  writeBufferAtomic,
  writeJsonAtomic,
  writeTextAtomic
} from "./io.ts";
import {
  createProjectConfig,
  CURRENT_STATE_SCHEMA_VERSION,
  currentProductVersion,
  GITIGNORE_SECTION_MARKERS,
  INSTALL_MANIFEST_PATH,
  inspectProjectInstallation,
  PROJECT_DIR,
  projectAssets,
  projectPaths,
  readInstallManifest,
  readProjectConfig,
  requireCurrentStateSchema
} from "./project.ts";
import { applyStateMigration, inferProjectStateSchema, planStateMigration } from "./migration.ts";
import { knownPlatformSectionAsset } from "./platform.ts";
import type {
  InstallManifest,
  LifecycleAction,
  LifecyclePlan,
  ManagedAsset,
  OwnershipRecord,
  PlatformId,
  ProjectConfig
} from "./types.ts";
import { assertSchema } from "./validation.ts";

const MANIFEST_ASSET_ID = "core.install-manifest";
const MANIFEST_BACKUP_ASSET_ID = "core.install-manifest-backup";
const LEGACY_BACKUP_ASSET_ID = "core.legacy-backup";
const LEGACY_STATE_ASSET_ID = "core.legacy-state";
const LEGACY_EXTERNAL_ASSETS = [
  { assetId: "core.legacy-codex-hooks", path: ".codex/hooks.json" },
  { assetId: "core.legacy-codex-hook-script", path: ".codex/hooks/opennori-activity.mjs" }
] as const;

type LegacyManagedFile = {
  path?: unknown;
  ownership?: {
    owner?: unknown;
    scope?: unknown;
    last_written_hash?: unknown;
  };
};

type LegacyManifest = {
  schema_version?: unknown;
  managed_files?: unknown;
};

export type AssetInspectionStatus = "missing" | "current" | "stale" | "modified" | "unowned" | "invalid";

export type AssetInspection = {
  asset_id: string;
  path: string;
  scope: "file" | "section";
  status: AssetInspectionStatus;
  exists: boolean;
  current_hash?: string;
  desired_hash: string;
  owned_hash?: string;
  reason: string;
};

export type LifecycleRunResult = {
  plan: LifecyclePlan;
  applied: boolean;
  manifest?: InstallManifest | null;
};

export type InitOptions = {
  developer: string;
  platforms?: PlatformId[];
  confirm?: boolean;
  productVersion?: string;
};

export type UpdateOptions = {
  confirm?: boolean;
  productVersion?: string;
};

export type PlatformAddOptions = {
  confirm?: boolean;
  productVersion?: string;
};

export type UninstallOptions = {
  confirm?: boolean;
};

export type RepairOptions = {
  confirm?: boolean;
  productVersion?: string;
};

type SectionBounds = { start: number; end: number };

type CurrentAssetState = {
  exists: boolean;
  valid: boolean;
  managedHash?: string;
  hostHash?: string;
  sectionPresent: boolean;
  reason?: string;
};

function resolvedRoot(root: string): string {
  return path.resolve(root);
}

function relativeBackupPath(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `.opennori.backup-${stamp}`;
}

function relativeManifestBackupPath(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${INSTALL_MANIFEST_PATH}.backup-${stamp}`;
}

function sectionBounds(content: string, markers: { start: string; end: string }): SectionBounds | null {
  const start = content.indexOf(markers.start);
  const endStart = content.indexOf(markers.end);
  if (start === -1 && endStart === -1) return null;
  if (start === -1 || endStart === -1 || endStart < start) {
    throw new OpenNoriError("managed_section_invalid", "Managed section markers are incomplete or out of order.");
  }
  if (content.indexOf(markers.start, start + markers.start.length) !== -1) {
    throw new OpenNoriError("managed_section_invalid", "Managed section start marker appears more than once.");
  }
  if (content.indexOf(markers.end, endStart + markers.end.length) !== -1) {
    throw new OpenNoriError("managed_section_invalid", "Managed section end marker appears more than once.");
  }
  return { start, end: endStart + markers.end.length };
}

function desiredManagedContent(asset: ManagedAsset): string {
  const normalized = normalizeText(asset.content);
  if (asset.scope === "file") return normalized;
  if (!asset.markers) {
    throw new OpenNoriError("asset_invalid", `Section asset ${asset.assetId} does not declare stable markers.`);
  }
  const bounds = sectionBounds(normalized, asset.markers);
  if (bounds?.start !== 0 || !bounds || normalized.slice(bounds.end).trim()) {
    throw new OpenNoriError("asset_invalid", `Section asset ${asset.assetId} must contain exactly one marked section.`);
  }
  return normalized.slice(bounds.start, bounds.end);
}

function currentAssetState(root: string, asset: ManagedAsset): CurrentAssetState {
  const filePath = safeProjectPath(root, asset.path);
  if (!fs.existsSync(filePath)) {
    return { exists: false, valid: true, sectionPresent: false };
  }
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    return {
      exists: true,
      valid: false,
      sectionPresent: false,
      reason: "Managed asset path exists but is not a regular file."
    };
  }
  const content = readText(filePath);
  const hostHash = contentHash(content);
  if (asset.scope === "file") {
    return { exists: true, valid: true, managedHash: hostHash, hostHash, sectionPresent: false };
  }
  if (!asset.markers) {
    return { exists: true, valid: false, hostHash, sectionPresent: false, reason: "Section markers are missing." };
  }
  try {
    const bounds = sectionBounds(content, asset.markers);
    if (!bounds) return { exists: true, valid: true, hostHash, sectionPresent: false };
    const section = content.slice(bounds.start, bounds.end);
    return {
      exists: true,
      valid: true,
      managedHash: contentHash(section),
      hostHash,
      sectionPresent: true
    };
  } catch (error) {
    return {
      exists: true,
      valid: false,
      hostHash,
      sectionPresent: false,
      reason: asOpenNoriError(error).message
    };
  }
}

function ownershipMatchesAsset(record: OwnershipRecord, asset: ManagedAsset): boolean {
  return (
    record.asset_id === asset.assetId &&
    record.platform === asset.platform &&
    record.path === asset.path &&
    record.scope === asset.scope &&
    record.policy === asset.policy
  );
}

/** Inspect one desired asset against both disk and the last successful OpenNori write. */
export function inspectManagedAsset(root: string, asset: ManagedAsset, ownership?: OwnershipRecord): AssetInspection {
  const state = currentAssetState(root, asset);
  const desiredHash = contentHash(desiredManagedContent(asset));
  if (!state.valid) {
    return {
      asset_id: asset.assetId,
      path: asset.path,
      scope: asset.scope,
      status: "invalid",
      exists: state.exists,
      current_hash: state.managedHash,
      desired_hash: desiredHash,
      owned_hash: ownership?.last_written_hash,
      reason: state.reason || "Managed asset cannot be inspected safely."
    };
  }
  if (!state.exists || (asset.scope === "section" && !state.sectionPresent)) {
    return {
      asset_id: asset.assetId,
      path: asset.path,
      scope: asset.scope,
      status: "missing",
      exists: state.exists,
      desired_hash: desiredHash,
      owned_hash: ownership?.last_written_hash,
      reason: state.exists ? "The managed section is absent from its host file." : "The managed file is absent."
    };
  }
  if (!ownership) {
    return {
      asset_id: asset.assetId,
      path: asset.path,
      scope: asset.scope,
      status: state.managedHash === desiredHash ? "unowned" : "modified",
      exists: true,
      current_hash: state.managedHash,
      desired_hash: desiredHash,
      reason:
        state.managedHash === desiredHash
          ? "Content matches the desired asset, but OpenNori did not write it and does not claim ownership."
          : "Existing content is not owned by OpenNori and will be preserved."
    };
  }
  if (!ownershipMatchesAsset(ownership, asset)) {
    return {
      asset_id: asset.assetId,
      path: asset.path,
      scope: asset.scope,
      status: "invalid",
      exists: true,
      current_hash: state.managedHash,
      desired_hash: desiredHash,
      owned_hash: ownership.last_written_hash,
      reason: "Manifest ownership metadata does not match the desired asset declaration."
    };
  }
  if (state.managedHash !== ownership.last_written_hash) {
    return {
      asset_id: asset.assetId,
      path: asset.path,
      scope: asset.scope,
      status: "modified",
      exists: true,
      current_hash: state.managedHash,
      desired_hash: desiredHash,
      owned_hash: ownership.last_written_hash,
      reason: "Managed content changed after the last OpenNori write and will be preserved."
    };
  }
  return {
    asset_id: asset.assetId,
    path: asset.path,
    scope: asset.scope,
    status: state.managedHash === desiredHash ? "current" : "stale",
    exists: true,
    current_hash: state.managedHash,
    desired_hash: desiredHash,
    owned_hash: ownership.last_written_hash,
    reason:
      state.managedHash === desiredHash
        ? "Managed content matches the current OpenNori asset."
        : "Managed content still matches the last OpenNori write and can be updated safely."
  };
}

function action(
  operation: LifecyclePlan["operation"],
  assetId: string,
  type: LifecycleAction["type"],
  pathValue: string,
  reason: string,
  options: Pick<LifecycleAction, "destructive" | "expected_hash" | "result_hash"> = { destructive: false }
): LifecycleAction {
  return {
    id: `${operation}:${assetId}`,
    type,
    asset_id: assetId,
    path: pathValue,
    reason,
    destructive: options.destructive,
    expected_hash: options.expected_hash,
    result_hash: options.result_hash
  };
}

function validateAssetCatalog(assets: readonly ManagedAsset[]): void {
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const asset of assets) {
    if (ids.has(asset.assetId)) throw new OpenNoriError("asset_invalid", `Duplicate managed asset id: ${asset.assetId}`);
    ids.add(asset.assetId);
    const normalizedPath = path.posix.normalize(asset.path.replaceAll("\\", "/"));
    if (normalizedPath !== asset.path || normalizedPath.startsWith("../") || path.posix.isAbsolute(normalizedPath)) {
      throw new OpenNoriError("asset_invalid", `Managed asset path is not canonical: ${asset.path}`);
    }
    if (paths.has(normalizedPath)) throw new OpenNoriError("asset_invalid", `Duplicate managed asset path: ${asset.path}`);
    paths.add(normalizedPath);
    desiredManagedContent(asset);
  }
}

function ownershipByAsset(manifest: InstallManifest, assets: readonly ManagedAsset[] = []): Map<string, OwnershipRecord> {
  const records = new Map<string, OwnershipRecord>();
  const paths = new Map<string, string>();
  const desiredById = new Map(assets.map((asset) => [asset.assetId, asset]));
  const desiredPaths = new Map(assets.map((asset) => [asset.path, asset.assetId]));
  for (const record of manifest.assets) {
    if (records.has(record.asset_id)) {
      throw new OpenNoriError("manifest_invalid", `Duplicate ownership record: ${record.asset_id}`);
    }
    const normalizedPath = path.posix.normalize(record.path.replaceAll("\\", "/"));
    if (normalizedPath !== record.path || normalizedPath.startsWith("../") || path.posix.isAbsolute(normalizedPath)) {
      throw new OpenNoriError("manifest_invalid", `Ownership path is not canonical: ${record.path}`);
    }
    const existingOwner = paths.get(normalizedPath);
    if (existingOwner) {
      throw new OpenNoriError("manifest_invalid", `Ownership path ${record.path} is shared by ${existingOwner} and ${record.asset_id}.`);
    }
    const desired = desiredById.get(record.asset_id);
    if (desired && !ownershipMatchesAsset(record, desired)) {
      throw new OpenNoriError("manifest_invalid", `Ownership metadata drifted for ${record.asset_id}.`);
    }
    const desiredOwner = desiredPaths.get(normalizedPath);
    if (!desired && desiredOwner) {
      throw new OpenNoriError("manifest_invalid", `Obsolete ownership ${record.asset_id} collides with current asset ${desiredOwner}.`);
    }
    records.set(record.asset_id, record);
    paths.set(normalizedPath, record.asset_id);
  }
  return records;
}

/** Validate manifest ownership against the current generated asset catalog. */
export function validateManifestOwnership(
  manifest: InstallManifest,
  assets: readonly ManagedAsset[]
): Map<string, OwnershipRecord> {
  return ownershipByAsset(manifest, assets);
}

function planDesiredAsset(
  operation: "init" | "update" | "platform-add",
  root: string,
  asset: ManagedAsset,
  ownership: OwnershipRecord | undefined,
  assumeMissing: boolean
): LifecycleAction {
  const desiredHash = contentHash(desiredManagedContent(asset));
  if (assumeMissing) {
    return action(operation, asset.assetId, "create", asset.path, "Legacy project state will be replaced by this generated asset.", {
      destructive: false,
      result_hash: desiredHash
    });
  }
  const state = currentAssetState(root, asset);
  if (!state.valid) {
    return action(operation, asset.assetId, "conflict", asset.path, state.reason || "Managed asset is not a regular file.", {
      destructive: false
    });
  }
  if (asset.policy === "seed" && operation !== "init") {
    if (ownership && !ownershipMatchesAsset(ownership, asset)) {
      return action(operation, asset.assetId, "conflict", asset.path, "Manifest ownership does not match the seeded asset.", {
        destructive: false
      });
    }
    if (!state.exists) {
      return action(operation, asset.assetId, "preserve", asset.path, "Deleted project-owned seed content will not be recreated.", {
        destructive: false
      });
    }
    return action(operation, asset.assetId, "skip", asset.path, "Seeded project content is user-owned and is never updated in place.", {
      destructive: false,
      expected_hash: state.managedHash
    });
  }
  if (!state.exists) {
    if (ownership) {
      return action(operation, asset.assetId, "create", asset.path, "Deleted managed content will be restored after confirmation.", {
        destructive: false,
        result_hash: desiredHash
      });
    }
    return action(operation, asset.assetId, "create", asset.path, "Missing generated asset will be created.", {
      destructive: false,
      result_hash: desiredHash
    });
  }

  if (asset.scope === "section" && !state.sectionPresent) {
    if (ownership) {
      return action(operation, asset.assetId, "update", asset.path, "Deleted managed section will be restored after confirmation.", {
        destructive: false,
        result_hash: desiredHash
      });
    }
    return action(operation, asset.assetId, "update", asset.path, "The managed section will be appended without replacing host content.", {
      destructive: false,
      expected_hash: state.hostHash,
      result_hash: desiredHash
    });
  }

  if (!ownership) {
    const type = state.managedHash === desiredHash ? "skip" : "conflict";
    return action(
      operation,
      asset.assetId,
      type,
      asset.path,
      type === "skip"
        ? "Existing content is byte-identical but was not written by OpenNori, so ownership is not claimed."
        : "Existing content has no OpenNori ownership proof and will be preserved.",
      { destructive: false, expected_hash: state.managedHash, result_hash: desiredHash }
    );
  }

  if (!ownershipMatchesAsset(ownership, asset)) {
    return action(operation, asset.assetId, "conflict", asset.path, "Manifest ownership does not match the desired asset.", {
      destructive: false
    });
  }
  if (state.managedHash !== ownership.last_written_hash) {
    return action(operation, asset.assetId, "conflict", asset.path, "Managed content was modified after the last OpenNori write and will be preserved.", {
      destructive: false,
      expected_hash: state.managedHash,
      result_hash: desiredHash
    });
  }
  if (state.managedHash === desiredHash) {
    return action(operation, asset.assetId, "skip", asset.path, "Managed content is current.", {
      destructive: false,
      expected_hash: state.managedHash,
      result_hash: desiredHash
    });
  }
  return action(operation, asset.assetId, "update", asset.path, "Unmodified managed content can be updated safely.", {
    destructive: false,
    expected_hash: state.managedHash,
    result_hash: desiredHash
  });
}

function planPlatformConfigAsset(
  root: string,
  asset: ManagedAsset,
  ownership: OwnershipRecord | undefined
): LifecycleAction {
  const state = currentAssetState(root, asset);
  const desiredHash = contentHash(desiredManagedContent(asset));
  if (!state.valid || !state.exists || !state.managedHash) {
    return action("platform-add", asset.assetId, "conflict", asset.path, "Project configuration must remain readable while adding a platform.", {
      destructive: false
    });
  }
  if (!ownership || !ownershipMatchesAsset(ownership, asset)) {
    return action("platform-add", asset.assetId, "conflict", asset.path, "Install ownership does not match the project configuration.", {
      destructive: false
    });
  }
  if (state.managedHash === desiredHash) {
    return action("platform-add", asset.assetId, "skip", asset.path, "The platform is already configured.", {
      destructive: false,
      expected_hash: state.managedHash,
      result_hash: desiredHash
    });
  }
  return action("platform-add", asset.assetId, "update", asset.path, "Add one platform without changing other project settings.", {
    destructive: false,
    expected_hash: state.managedHash,
    result_hash: desiredHash
  });
}

function platformSetKey(platforms: readonly PlatformId[]): string {
  return [...platforms].sort().join(",");
}

function platformAddContext(
  root: string,
  assets: readonly ManagedAsset[]
): { added: PlatformId | null; configAsset: ManagedAsset } {
  const currentConfig = readProjectConfig(root);
  const manifest = readInstallManifest(root);
  if (platformSetKey(currentConfig.platforms) !== platformSetKey(manifest.platforms)) {
    throw new OpenNoriError("platform_state_mismatch", "Project config and install manifest disagree on configured platforms.", {
      recovery: "Restore the last verified platform configuration, then preview the platform addition again."
    });
  }

  const targetPlatforms = [
    ...new Set(assets.filter((asset) => asset.platform !== "core").map((asset) => asset.platform as PlatformId))
  ];
  const preservesCurrentOrder = currentConfig.platforms.every((platform, index) => targetPlatforms[index] === platform);
  if (!preservesCurrentOrder || targetPlatforms.length < currentConfig.platforms.length || targetPlatforms.length > currentConfig.platforms.length + 1) {
    throw new OpenNoriError("platform_plan_invalid", "A platform-add plan may append one platform without removing or reordering existing platforms.");
  }
  const added = targetPlatforms.length === currentConfig.platforms.length ? null : targetPlatforms[targetPlatforms.length - 1] ?? null;
  const targetConfig: ProjectConfig = { ...currentConfig, platforms: targetPlatforms };
  const canonicalAssets = projectAssets(targetConfig);
  const canonicalById = new Map(canonicalAssets.map((asset) => [asset.assetId, asset]));
  if (canonicalAssets.length !== assets.length) {
    throw new OpenNoriError("platform_plan_invalid", "Platform-add assets do not match the canonical project surface.");
  }
  for (const asset of assets) {
    const canonical = canonicalById.get(asset.assetId);
    if (
      !canonical ||
      canonical.platform !== asset.platform ||
      canonical.path !== asset.path ||
      canonical.scope !== asset.scope ||
      canonical.policy !== asset.policy ||
      contentHash(desiredManagedContent(canonical)) !== contentHash(desiredManagedContent(asset))
    ) {
      throw new OpenNoriError("platform_plan_invalid", `Platform-add asset is not canonical: ${asset.assetId}.`);
    }
  }
  const configAsset = canonicalById.get("core.project-config");
  if (!configAsset) throw new OpenNoriError("platform_plan_invalid", "Platform-add assets are missing the project configuration.");
  return { added, configAsset };
}

function treeHash(root: string, relativePath: string): string {
  const treeRoot = safeProjectPath(root, relativePath);
  if (!fs.existsSync(treeRoot)) return contentHash("");
  const hash = crypto.createHash("sha256");
  const stack = [treeRoot];
  const entries: string[] = [];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) {
      throw new OpenNoriError("unsafe_path", `Legacy state contains a symbolic link: ${path.relative(root, current)}`);
    }
    if (stat.isDirectory()) {
      const children = fs.readdirSync(current).sort().reverse();
      for (const child of children) stack.push(path.join(current, child));
    } else if (stat.isFile()) {
      entries.push(current);
    }
  }
  for (const filePath of entries.sort()) {
    hash.update(path.relative(treeRoot, filePath).split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(filePath));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

function legacyOwnershipHash(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.startsWith("sha256:") ? value : `sha256:${value}`;
  return /^sha256:[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}

function legacyExternalAssetActions(root: string): {
  actions: LifecycleAction[];
  blockers: string[];
  warnings: string[];
} {
  const manifest = readJson<LegacyManifest>(safeProjectPath(root, INSTALL_MANIFEST_PATH));
  const managedFiles = Array.isArray(manifest.managed_files) ? (manifest.managed_files as LegacyManagedFile[]) : [];
  const actions: LifecycleAction[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  for (const candidate of LEGACY_EXTERNAL_ASSETS) {
    const filePath = safeProjectPath(root, candidate.path);
    if (!fs.existsSync(filePath)) continue;
    const stat = fs.lstatSync(filePath);
    const record = managedFiles.find((entry) => entry.path === candidate.path);
    const ownedHash = legacyOwnershipHash(record?.ownership?.last_written_hash);
    const ownershipMatches = record?.ownership?.owner === "opennori" && record.ownership.scope === "file";
    const currentHash = stat.isFile() && !stat.isSymbolicLink() ? contentHash(readText(filePath)) : undefined;
    const canRemove = ownershipMatches && ownedHash !== null && currentHash === ownedHash;

    if (canRemove) {
      actions.push(
        action("init", candidate.assetId, "remove", candidate.path, "Unmodified legacy generated hook will be removed during foundation migration.", {
          destructive: true,
          expected_hash: currentHash
        })
      );
      continue;
    }

    actions.push(
      action("init", candidate.assetId, "preserve", candidate.path, "Legacy hook lacks matching ownership proof and will not be changed.", {
        destructive: false,
        expected_hash: currentHash
      })
    );
    blockers.push(`${candidate.path} has local changes or lacks legacy ownership proof.`);
    warnings.push(`Move or review ${candidate.path} before retrying initialization; OpenNori will not delete it.`);
  }

  return { actions, blockers, warnings };
}

function blockedPlan(operation: LifecyclePlan["operation"], root: string, error: unknown): LifecyclePlan {
  const failure = asOpenNoriError(error);
  return {
    schema_version: "opennori/lifecycle-plan-v1",
    operation,
    root: resolvedRoot(root),
    actions: [],
    blockers: [failure.message],
    warnings: failure.recovery ? [failure.recovery] : []
  };
}

/** Plan first-time Codex initialization without writing to the project. */
export function planInit(
  root: string,
  developer: string,
  productVersion = currentProductVersion(),
  platforms: PlatformId[] = ["codex"]
): LifecyclePlan {
  const projectRoot = resolvedRoot(root);
  try {
    const config = createProjectConfig(developer, platforms);
    const assets = projectAssets(config);
    validateAssetCatalog(assets);
    const installation = inspectProjectInstallation(projectRoot);
    if (installation.state === "foundation") {
      return {
        schema_version: "opennori/lifecycle-plan-v1",
        operation: "init",
        root: projectRoot,
        actions: [
          action("init", MANIFEST_ASSET_ID, "skip", INSTALL_MANIFEST_PATH, "Project is already initialized; use opennori update.", {
            destructive: false
          })
        ],
        blockers: [],
        warnings: ["Initialization is intentionally not a refresh operation."]
      };
    }
    if (installation.state === "damaged_foundation") {
      return blockedPlan(
        "init",
        projectRoot,
        new OpenNoriError("foundation_damaged", installation.reason, {
          recovery: "Review a manifest repair plan. Initialization will not replace ambiguous or damaged foundation state."
        })
      );
    }

    const replacingLegacy = installation.state === "legacy";
    const actions: LifecycleAction[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (replacingLegacy) {
      const backupPath = relativeBackupPath();
      const backupTarget = safeProjectPath(projectRoot, backupPath);
      const legacyHash = treeHash(projectRoot, PROJECT_DIR);
      const legacyExternal = legacyExternalAssetActions(projectRoot);
      if (fs.existsSync(backupTarget)) blockers.push(`Backup target already exists: ${backupPath}`);
      actions.push(
        action("init", LEGACY_BACKUP_ASSET_ID, "create", backupPath, "Existing .opennori state will be copied before replacement.", {
          destructive: false,
          expected_hash: legacyHash,
          result_hash: legacyHash
        }),
        action("init", LEGACY_STATE_ASSET_ID, "remove", PROJECT_DIR, "Legacy .opennori state will be replaced only after backup succeeds.", {
          destructive: true,
          expected_hash: legacyHash
        }),
        ...legacyExternal.actions
      );
      blockers.push(...legacyExternal.blockers);
      warnings.push(`Existing state will be preserved at ${backupPath}.`);
      warnings.push(...legacyExternal.warnings);
    }

    for (const asset of assets) {
      actions.push(planDesiredAsset("init", projectRoot, asset, undefined, replacingLegacy && asset.path.startsWith(`${PROJECT_DIR}/`)));
    }
    actions.push(
      action("init", MANIFEST_ASSET_ID, "create", INSTALL_MANIFEST_PATH, `Install manifest will record OpenNori ${productVersion} writes.`, {
        destructive: false
      })
    );
    return {
      schema_version: "opennori/lifecycle-plan-v1",
      operation: "init",
      root: projectRoot,
      actions,
      blockers,
      warnings
    };
  } catch (error) {
    return blockedPlan("init", projectRoot, error);
  }
}

/**
 * Reconstruct ownership only for generated content that still byte-matches the
 * current package. Project-owned seeds and modified/unrecognized content are
 * deliberately left unowned.
 */
export function planManifestRepair(root: string, productVersion = currentProductVersion()): LifecyclePlan {
  const projectRoot = resolvedRoot(root);
  try {
    const installation = inspectProjectInstallation(projectRoot);
    if (installation.state === "absent") {
      throw new OpenNoriError("project_not_initialized", `${PROJECT_DIR} does not exist.`, {
        recovery: "Initialize the project before attempting manifest repair."
      });
    }
    if (installation.state === "legacy") {
      throw new OpenNoriError("legacy_state_detected", "Legacy OpenNori state requires an initialization migration, not manifest repair.");
    }

    const config = readProjectConfig(projectRoot);
    const assets = projectAssets(config);
    validateAssetCatalog(assets);
    let readableManifest: InstallManifest | null = null;
    try {
      readableManifest = readInstallManifest(projectRoot);
    } catch {
      readableManifest = null;
    }
    if (
      readableManifest &&
      [...readableManifest.platforms].sort().join(",") !== [...config.platforms].sort().join(",")
    ) {
      throw new OpenNoriError("platform_change_requires_migration", "Project platforms changed without removing the previously managed adapter assets.", {
        context: { configured_platforms: config.platforms, installed_platforms: readableManifest.platforms },
        recovery:
          "Restore config.yaml platforms to the installed manifest values. Add another adapter only through 'opennori platform add <platform> --dry-run' followed by --confirm."
      });
    }
    try {
      if (!readableManifest) throw new Error("manifest unavailable");
      ownershipByAsset(readableManifest, assets);
      return {
        schema_version: "opennori/lifecycle-plan-v1",
        operation: "repair",
        root: projectRoot,
        actions: [
          action("repair", MANIFEST_ASSET_ID, "skip", INSTALL_MANIFEST_PATH, "Install manifest is readable and schema-valid.", {
            destructive: false
          })
        ],
        blockers: [],
        warnings: [],
        state_schema_version: readableManifest.state_schema_version
      };
    } catch {
      // Missing or invalid ownership state is the condition this plan repairs.
    }

    const repairedStateSchema = inferProjectStateSchema(projectRoot);

    const actions: LifecycleAction[] = [];
    const manifestPath = projectPaths(projectRoot).manifest;
    const manifestExists = fs.existsSync(manifestPath);
    let manifestHash: string | undefined;
    if (manifestExists) {
      if (!fs.statSync(manifestPath).isFile()) {
        throw new OpenNoriError("manifest_invalid", `${INSTALL_MANIFEST_PATH} is not a regular file.`, {
          recovery: "Move the conflicting path aside before repairing the manifest."
        });
      }
      manifestHash = contentHash(readText(manifestPath));
      const backupPath = relativeManifestBackupPath();
      if (fs.existsSync(safeProjectPath(projectRoot, backupPath))) {
        throw new OpenNoriError("backup_conflict", `Manifest backup target already exists: ${backupPath}`);
      }
      actions.push(
        action("repair", MANIFEST_BACKUP_ASSET_ID, "create", backupPath, "Unreadable manifest will be preserved before replacement.", {
          destructive: false,
          expected_hash: manifestHash,
          result_hash: manifestHash
        })
      );
    }

    for (const asset of assets) {
      if (asset.policy === "seed") continue;
      const inspection = inspectManagedAsset(projectRoot, asset);
      if (inspection.status === "unowned" && inspection.current_hash === inspection.desired_hash) {
        actions.push(
          action("repair", asset.assetId, "adopt", asset.path, "Byte-identical generated content can be safely restored to manifest ownership.", {
            destructive: false,
            expected_hash: inspection.current_hash,
            result_hash: inspection.desired_hash
          })
        );
        continue;
      }
      if (inspection.status === "missing") {
        actions.push(action("repair", asset.assetId, "skip", asset.path, "Missing generated content remains unowned for a later managed update.", { destructive: false }));
        continue;
      }
      actions.push(
        action("repair", asset.assetId, "preserve", asset.path, "Content cannot be proven as the current generated asset and will remain unowned.", {
          destructive: false,
          expected_hash: inspection.current_hash,
          result_hash: inspection.desired_hash
        })
      );
    }

    actions.push(
      action(
        "repair",
        MANIFEST_ASSET_ID,
        manifestExists ? "update" : "create",
        INSTALL_MANIFEST_PATH,
        `Install manifest will be reconstructed for OpenNori ${productVersion} from hash-proven generated assets only.`,
        { destructive: false, expected_hash: manifestHash }
      )
    );
    return {
      schema_version: "opennori/lifecycle-plan-v1",
      operation: "repair",
      root: projectRoot,
      actions,
      blockers: [],
      warnings: actions.filter((entry) => entry.type === "preserve").map((entry) => `${entry.path}: ${entry.reason}`),
      state_schema_version: repairedStateSchema
    };
  } catch (error) {
    return blockedPlan("repair", projectRoot, error);
  }
}

function obsoleteOwnershipAction(root: string, record: OwnershipRecord): LifecycleAction {
  let filePath: string;
  try {
    filePath = safeProjectPath(root, record.path);
  } catch (error) {
    return action("update", record.asset_id, "conflict", record.path, asOpenNoriError(error).message, { destructive: false });
  }
  if (!fs.existsSync(filePath)) {
    return action("update", record.asset_id, "remove", record.path, "Absent obsolete content will be released from ownership.", {
      destructive: false
    });
  }
  if (record.scope === "section") {
    return action("update", record.asset_id, "conflict", record.path, "Obsolete section ownership lacks a current asset declaration and is preserved.", {
      destructive: false
    });
  }
  if (!fs.statSync(filePath).isFile()) {
    return action("update", record.asset_id, "conflict", record.path, "Obsolete managed path is not a regular file.", {
      destructive: false
    });
  }
  const currentHash = contentHash(readText(filePath));
  return action(
    "update",
    record.asset_id,
    currentHash === record.last_written_hash ? "remove" : "conflict",
    record.path,
    currentHash === record.last_written_hash
      ? "Unmodified obsolete managed file can be removed."
      : "Obsolete managed file was modified and will be preserved.",
    { destructive: currentHash === record.last_written_hash, expected_hash: currentHash }
  );
}

/** Plan a managed asset refresh. This is the default, side-effect-free update behavior. */
export function planUpdate(root: string, productVersion = currentProductVersion()): LifecyclePlan {
  const projectRoot = resolvedRoot(root);
  try {
    const config = readProjectConfig(projectRoot);
    const manifest = readInstallManifest(projectRoot);
    const assets = projectAssets(config);
    validateAssetCatalog(assets);
    const records = ownershipByAsset(manifest, assets);
    const stateMigration = planStateMigration(projectRoot, manifest);
    const desiredIds = new Set(assets.map((asset) => asset.assetId));
    const actions = assets.map((asset) => planDesiredAsset("update", projectRoot, asset, records.get(asset.assetId), false));
    if (stateMigration) {
      actions.unshift(
        action(
          "update",
          "core.state-schema-v2",
          "update",
          PROJECT_DIR,
          `Migrate ${stateMigration.task_files.length} task record(s) from state schema 1 to 2 with rollback protection.`,
          { destructive: false }
        )
      );
    }
    for (const record of manifest.assets) {
      if (!desiredIds.has(record.asset_id)) actions.push(obsoleteOwnershipAction(projectRoot, record));
    }
    const manifestHash = contentHash(readText(projectPaths(projectRoot).manifest));
    const writes = actions.some((entry) => entry.type === "create" || entry.type === "update" || entry.type === "remove");
    actions.push(
      action(
        "update",
        MANIFEST_ASSET_ID,
        writes || manifest.product_version !== productVersion ? "update" : "skip",
        INSTALL_MANIFEST_PATH,
        writes || manifest.product_version !== productVersion
          ? "Install manifest will be written last with only successful ownership changes."
          : "Install manifest is current.",
        { destructive: false, expected_hash: manifestHash }
      )
    );
    const blockers: string[] = [];
    if (platformSetKey(config.platforms) !== platformSetKey(manifest.platforms)) {
      blockers.push("Project config platforms do not match the install manifest.");
    }
    return {
      schema_version: "opennori/lifecycle-plan-v1",
      operation: "update",
      root: projectRoot,
      actions,
      blockers,
      warnings: actions.filter((entry) => entry.type === "conflict" || entry.type === "preserve").map((entry) => `${entry.path}: ${entry.reason}`),
      state_migration: stateMigration
    };
  } catch (error) {
    return blockedPlan("update", projectRoot, error);
  }
}

/** Preview adding one platform adapter without refreshing existing managed assets. */
export function planPlatformAdd(
  root: string,
  platform: PlatformId,
  productVersion = currentProductVersion()
): LifecyclePlan {
  const projectRoot = resolvedRoot(root);
  try {
    requireCurrentStateSchema(projectRoot);
    const currentConfig = readProjectConfig(projectRoot);
    const manifest = readInstallManifest(projectRoot);
    if (platformSetKey(currentConfig.platforms) !== platformSetKey(manifest.platforms)) {
      throw new OpenNoriError("platform_state_mismatch", "Project config and install manifest disagree on configured platforms.", {
        recovery: "Restore the last verified platform configuration, then preview the platform addition again."
      });
    }
    const platforms = currentConfig.platforms.includes(platform) ? currentConfig.platforms : [...currentConfig.platforms, platform];
    const targetConfig: ProjectConfig = { ...currentConfig, platforms };
    const assets = projectAssets(targetConfig);
    validateAssetCatalog(assets);
    const records = ownershipByAsset(manifest, assets);
    const { added, configAsset } = platformAddContext(projectRoot, assets);
    const actions = [planPlatformConfigAsset(projectRoot, configAsset, records.get(configAsset.assetId))];
    if (added) {
      for (const asset of assets.filter((candidate) => candidate.platform === added)) {
        actions.push(planDesiredAsset("platform-add", projectRoot, asset, records.get(asset.assetId), false));
      }
    }
    const relevantActions = added
      ? actions.filter((entry) => entry.asset_id === configAsset.assetId || entry.asset_id.startsWith(`${added}.`))
      : actions;
    const blockers = relevantActions
      .filter((entry) => entry.type === "conflict" || entry.type === "preserve" || (entry.type === "skip" && !records.has(entry.asset_id)))
      .map((entry) => `${entry.path}: ${entry.reason}`);
    const writes = actions.some((entry) => entry.type === "create" || entry.type === "update");
    const updateManifest = added !== null && (writes || manifest.product_version !== productVersion);
    const manifestHash = contentHash(readText(projectPaths(projectRoot).manifest));
    actions.push(
      action(
        "platform-add",
        MANIFEST_ASSET_ID,
        updateManifest ? "update" : "skip",
        INSTALL_MANIFEST_PATH,
        updateManifest
          ? "Install manifest will record the added platform after every adapter asset is written."
          : "The platform is already configured.",
        { destructive: false, expected_hash: manifestHash }
      )
    );
    return {
      schema_version: "opennori/lifecycle-plan-v1",
      operation: "platform-add",
      root: projectRoot,
      actions,
      blockers,
      warnings: blockers
    };
  } catch (error) {
    return blockedPlan("platform-add", projectRoot, error);
  }
}

function knownSectionAsset(record: OwnershipRecord): ManagedAsset | null {
  const platformAsset = knownPlatformSectionAsset(record);
  if (platformAsset) return platformAsset;
  if (record.asset_id === "core.runtime-ignore") {
    return {
      assetId: record.asset_id,
      platform: "core",
      path: record.path,
      scope: "section",
      policy: "managed",
      content: `${GITIGNORE_SECTION_MARKERS.start}\n${GITIGNORE_SECTION_MARKERS.end}\n`,
      markers: GITIGNORE_SECTION_MARKERS
    };
  }
  return null;
}

function planOwnershipRemoval(root: string, record: OwnershipRecord): LifecycleAction {
  let filePath: string;
  try {
    filePath = safeProjectPath(root, record.path);
  } catch (error) {
    return action("uninstall", record.asset_id, "conflict", record.path, asOpenNoriError(error).message, {
      destructive: false
    });
  }
  if (!fs.existsSync(filePath)) {
    return action("uninstall", record.asset_id, "skip", record.path, "Managed content is already absent.", {
      destructive: false
    });
  }
  if (record.policy === "seed") {
    return action("uninstall", record.asset_id, "skip", record.path, "Seeded project content is preserved and ownership will be released.", {
      destructive: false
    });
  }
  if (!fs.statSync(filePath).isFile()) {
    return action("uninstall", record.asset_id, "conflict", record.path, "Managed path is not a regular file and will be preserved.", {
      destructive: false
    });
  }
  let currentHash: string | undefined;
  if (record.scope === "file") {
    currentHash = contentHash(readText(filePath));
  } else {
    const sectionAsset = knownSectionAsset(record);
    if (!sectionAsset?.markers) {
      return action("uninstall", record.asset_id, "conflict", record.path, "Managed section markers are unknown; host content will be preserved.", {
        destructive: false
      });
    }
    const content = readText(filePath);
    try {
      const bounds = sectionBounds(content, sectionAsset.markers);
      currentHash = bounds ? contentHash(content.slice(bounds.start, bounds.end)) : undefined;
    } catch (error) {
      return action("uninstall", record.asset_id, "conflict", record.path, asOpenNoriError(error).message, {
        destructive: false
      });
    }
  }
  const safe = currentHash === record.last_written_hash;
  return action(
    "uninstall",
    record.asset_id,
    safe ? "remove" : "conflict",
    record.path,
    safe ? "Managed content still matches the last OpenNori write and can be removed." : "Managed content changed and will be preserved.",
    { destructive: safe, expected_hash: currentHash }
  );
}

function runtimeSessionRemovalActions(root: string): LifecycleAction[] {
  const relativeDirectory = `${PROJECT_DIR}/.runtime/sessions`;
  const directory = safeProjectPath(root, relativeDirectory);
  if (!fs.existsSync(directory)) return [];
  const actions: LifecycleAction[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".gitkeep") continue;
    const relativePath = `${relativeDirectory}/${entry.name}`;
    if (!entry.isFile() || !/^[a-f0-9]{64}\.json$/.test(entry.name)) {
      actions.push(
        action("uninstall", `core.runtime-session.${entry.name}`, "skip", relativePath, "Unknown runtime entry will be preserved.", {
          destructive: false
        })
      );
      continue;
    }
    const filePath = safeProjectPath(root, relativePath);
    let ownedSession = false;
    try {
      const payload = readJson<unknown>(filePath);
      assertSchema("session", payload);
      ownedSession = true;
    } catch {
      ownedSession = false;
    }
    if (!ownedSession) {
      actions.push(
        action("uninstall", `core.runtime-session.${entry.name.slice(0, -5)}`, "skip", relativePath, "Unrecognized runtime JSON will be preserved.", {
          destructive: false
        })
      );
      continue;
    }
    actions.push(
      action("uninstall", `core.runtime-session.${entry.name.slice(0, -5)}`, "remove", relativePath, "Host-local task selection will be removed.", {
        destructive: true,
        expected_hash: contentHash(readText(filePath))
      })
    );
  }
  return actions;
}

function runtimeUnknownAssetId(kind: string, relativePath: string): string {
  return `core.runtime-${kind}-unknown.${crypto.createHash("sha256").update(relativePath).digest("hex")}`;
}

function runtimeUnclassifiedRemovalActions(root: string): LifecycleAction[] {
  const relativeRoot = `${PROJECT_DIR}/.runtime`;
  const directory = safeProjectPath(root, relativeRoot);
  if (!fs.existsSync(directory)) return [];

  const actions: LifecycleAction[] = [];
  const knownDirectories = new Set(["sessions"]);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (knownDirectories.has(entry.name)) continue;
    const relativePath = `${relativeRoot}/${entry.name}`;
    if (entry.name === "locks" && entry.isDirectory() && !entry.isSymbolicLink()) {
      const lockDirectory = safeProjectPath(root, relativePath);
      for (const lockEntry of fs.readdirSync(lockDirectory, { withFileTypes: true })) {
        const lockPath = `${relativePath}/${lockEntry.name}`;
        actions.push(
          action(
            "uninstall",
            runtimeUnknownAssetId("lock", lockPath),
            "skip",
            lockPath,
            "Unknown runtime lock entry will be preserved.",
            { destructive: false }
          )
        );
      }
      continue;
    }
    actions.push(
      action(
        "uninstall",
        runtimeUnknownAssetId("unclassified", relativePath),
        "skip",
        relativePath,
        "Unknown runtime entry will be preserved.",
        { destructive: false }
      )
    );
  }
  return actions;
}

function runtimeRemovalActions(root: string): LifecycleAction[] {
  return [...runtimeSessionRemovalActions(root), ...runtimeUnclassifiedRemovalActions(root)];
}

function uninstallActions(root: string, records: readonly OwnershipRecord[]): LifecycleAction[] {
  const ownershipActions = records.map((record) => planOwnershipRemoval(root, record));
  const runtimeActions = runtimeRemovalActions(root);
  if (runtimeActions.some((entry) => entry.type === "skip")) {
    const ignoreIndex = ownershipActions.findIndex((entry) => entry.asset_id === "core.runtime-ignore");
    const ignore = ownershipActions[ignoreIndex];
    if (ignore) {
      ownershipActions[ignoreIndex] = action(
        "uninstall",
        ignore.asset_id,
        ignore.type === "remove" ? "conflict" : "preserve",
        ignore.path,
        "Unknown host-local runtime state remains, so its ignore rule and ownership will be preserved.",
        { destructive: false, expected_hash: ignore.expected_hash }
      );
    }
  }
  return [...ownershipActions, ...runtimeActions];
}

/** Plan removal of owned content while preserving all unowned or modified project data. */
export function planUninstall(root: string): LifecyclePlan {
  const projectRoot = resolvedRoot(root);
  try {
    const config = readProjectConfig(projectRoot);
    const assets = projectAssets(config);
    const manifest = readInstallManifest(projectRoot);
    ownershipByAsset(manifest, assets);
    const actions = uninstallActions(projectRoot, manifest.assets);
    const hasConflicts = actions.some((entry) => entry.type === "conflict" || entry.type === "preserve");
    const manifestHash = contentHash(readText(projectPaths(projectRoot).manifest));
    actions.push(
      action(
        "uninstall",
        MANIFEST_ASSET_ID,
        hasConflicts ? "update" : "remove",
        INSTALL_MANIFEST_PATH,
        hasConflicts
          ? "Ownership manifest will retain locally modified content for later review."
          : "Ownership manifest will be removed after every managed asset is removed.",
        { destructive: !hasConflicts, expected_hash: manifestHash }
      )
    );
    return {
      schema_version: "opennori/lifecycle-plan-v1",
      operation: "uninstall",
      root: projectRoot,
      actions,
      blockers: [],
      warnings: actions.filter((entry) => entry.type === "conflict").map((entry) => `${entry.path}: ${entry.reason}`)
    };
  } catch (error) {
    return blockedPlan("uninstall", projectRoot, error);
  }
}

function actionCurrentHash(root: string, actionValue: LifecycleAction, asset?: ManagedAsset): string | undefined {
  if (actionValue.asset_id === LEGACY_BACKUP_ASSET_ID || actionValue.asset_id === LEGACY_STATE_ASSET_ID) {
    return treeHash(root, PROJECT_DIR);
  }
  if (actionValue.asset_id === MANIFEST_BACKUP_ASSET_ID) {
    const manifestPath = safeProjectPath(root, INSTALL_MANIFEST_PATH);
    return fs.existsSync(manifestPath) && fs.statSync(manifestPath).isFile() ? contentHash(readText(manifestPath)) : undefined;
  }
  const filePath = safeProjectPath(root, actionValue.path);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return undefined;
  if (!asset || asset.scope === "file") return contentHash(readText(filePath));
  const state = currentAssetState(root, asset);
  return state.sectionPresent ? state.managedHash : state.hostHash;
}

function isControlledSpecialAction(plan: LifecyclePlan, entry: LifecycleAction): boolean {
  if (entry.asset_id === MANIFEST_ASSET_ID) return entry.path === INSTALL_MANIFEST_PATH;
  if (entry.asset_id === LEGACY_STATE_ASSET_ID) {
    return plan.operation === "init" && entry.type === "remove" && entry.path === PROJECT_DIR;
  }
  if (entry.asset_id === LEGACY_BACKUP_ASSET_ID) {
    return plan.operation === "init" && entry.type === "create" && /^\.opennori\.backup-\d{8}T\d{6}Z$/.test(entry.path);
  }
  if (entry.asset_id === MANIFEST_BACKUP_ASSET_ID) {
    return (
      plan.operation === "repair" &&
      entry.type === "create" &&
      new RegExp(`^${INSTALL_MANIFEST_PATH.replaceAll(".", "\\.")}\\.backup-\\d{8}T\\d{6}Z$`).test(entry.path)
    );
  }
  const legacyExternal = LEGACY_EXTERNAL_ASSETS.find((candidate) => candidate.assetId === entry.asset_id);
  if (legacyExternal) {
    return (
      plan.operation === "init" &&
      entry.path === legacyExternal.path &&
      (entry.type === "remove" || entry.type === "preserve")
    );
  }
  if (plan.operation === "uninstall" && entry.type === "remove" && entry.asset_id.startsWith("core.runtime-session.")) {
    const sessionId = entry.asset_id.slice("core.runtime-session.".length);
    return /^[a-f0-9]{64}$/.test(sessionId) && entry.path === `${PROJECT_DIR}/.runtime/sessions/${sessionId}.json`;
  }
  return false;
}

function sameActionSemantics(actual: LifecycleAction, expected: LifecycleAction): boolean {
  return (
    actual.asset_id === expected.asset_id &&
    actual.type === expected.type &&
    actual.path === expected.path &&
    actual.destructive === expected.destructive &&
    actual.expected_hash === expected.expected_hash &&
    actual.result_hash === expected.result_hash
  );
}

function expectedManagedAction(
  plan: LifecyclePlan,
  asset: ManagedAsset | undefined,
  owned: OwnershipRecord | undefined,
  replacesLegacy: boolean
): LifecycleAction | null {
  if (asset) {
    if (plan.operation === "init") {
      return planDesiredAsset("init", plan.root, asset, undefined, replacesLegacy && asset.path.startsWith(`${PROJECT_DIR}/`));
    }
    if (plan.operation === "update") return planDesiredAsset("update", plan.root, asset, owned, false);
    if (plan.operation === "platform-add") {
      return asset.assetId === "core.project-config"
        ? planPlatformConfigAsset(plan.root, asset, owned)
        : planDesiredAsset("platform-add", plan.root, asset, owned, false);
    }
    if (plan.operation === "uninstall") return owned ? planOwnershipRemoval(plan.root, owned) : null;
    if (plan.operation === "repair") {
      if (asset.policy === "seed") return null;
      const inspection = inspectManagedAsset(plan.root, asset);
      if (inspection.status === "unowned" && inspection.current_hash === inspection.desired_hash) {
        return action("repair", asset.assetId, "adopt", asset.path, "Byte-identical generated content can be safely restored to manifest ownership.", {
          destructive: false,
          expected_hash: inspection.current_hash,
          result_hash: inspection.desired_hash
        });
      }
      if (inspection.status === "missing") {
        return action("repair", asset.assetId, "skip", asset.path, "Missing generated content remains unowned for a later managed update.", {
          destructive: false
        });
      }
      return action("repair", asset.assetId, "preserve", asset.path, "Content cannot be proven as the current generated asset and will remain unowned.", {
        destructive: false,
        expected_hash: inspection.current_hash,
        result_hash: inspection.desired_hash
      });
    }
  }
  if (owned && plan.operation === "update") return obsoleteOwnershipAction(plan.root, owned);
  if (owned && plan.operation === "uninstall") return planOwnershipRemoval(plan.root, owned);
  return null;
}

function preflight(plan: LifecyclePlan, assets: readonly ManagedAsset[]): void {
  if (plan.blockers.length > 0) {
    throw new OpenNoriError("lifecycle_blocked", plan.blockers.join(" "), {
      recovery: "Resolve every blocker, then build a fresh lifecycle plan."
    });
  }
  if (resolvedRoot(plan.root) !== plan.root) {
    throw new OpenNoriError("plan_invalid", "Lifecycle plan root must be absolute and normalized.");
  }
  const assetMap = new Map(assets.map((asset) => [asset.assetId, asset]));
  const previousOwnership =
    plan.operation === "update" || plan.operation === "platform-add" || plan.operation === "uninstall"
      ? ownershipByAsset(readInstallManifest(plan.root), assets)
      : new Map<string, OwnershipRecord>();
  const platformContext = plan.operation === "platform-add" ? platformAddContext(plan.root, assets) : null;
  const installationState = plan.operation === "init" ? inspectProjectInstallation(plan.root).state : null;
  const replacesLegacy = installationState === "legacy";
  let repairNeeded = false;
  if (plan.operation === "repair") {
    const config = readProjectConfig(plan.root);
    let manifest: InstallManifest | null = null;
    try {
      manifest = readInstallManifest(plan.root);
    } catch {
      manifest = null;
    }
    if (manifest && [...manifest.platforms].sort().join(",") !== [...config.platforms].sort().join(",")) {
      throw new OpenNoriError("platform_change_requires_migration", "Project platforms changed without removing the previously managed adapter assets.", {
        context: { configured_platforms: config.platforms, installed_platforms: manifest.platforms },
        recovery:
          "Restore config.yaml platforms to the installed manifest values. Add another adapter only through 'opennori platform add <platform> --dry-run' followed by --confirm."
      });
    }
    try {
      if (!manifest) throw new Error("manifest unavailable");
      ownershipByAsset(manifest, assets);
      repairNeeded = false;
    } catch {
      repairNeeded = true;
    }
  }
  const actionIds = new Set<string>();
  const actionAssets = new Set<string>();
  for (const entry of plan.actions) {
    if (actionIds.has(entry.id) || actionAssets.has(entry.asset_id)) {
      throw new OpenNoriError("plan_invalid", `Lifecycle plan contains a duplicate action for ${entry.asset_id}.`);
    }
    actionIds.add(entry.id);
    actionAssets.add(entry.asset_id);
  }

  const actualByAsset = new Map(plan.actions.map((entry) => [entry.asset_id, entry]));
  const expectedByAsset = new Map<string, LifecycleAction>();
  const addExpected = (entry: LifecycleAction | null): void => {
    if (entry) expectedByAsset.set(entry.asset_id, entry);
  };
  if (plan.operation === "init") {
    if (installationState !== "foundation") {
      for (const asset of assets) addExpected(expectedManagedAction(plan, asset, undefined, replacesLegacy));
    }
  } else if (plan.operation === "update") {
    for (const asset of assets) addExpected(expectedManagedAction(plan, asset, previousOwnership.get(asset.assetId), false));
    for (const record of previousOwnership.values()) {
      if (!assetMap.has(record.asset_id)) addExpected(expectedManagedAction(plan, undefined, record, false));
    }
  } else if (plan.operation === "platform-add" && platformContext) {
    addExpected(expectedManagedAction(plan, platformContext.configAsset, previousOwnership.get(platformContext.configAsset.assetId), false));
    if (platformContext.added) {
      for (const asset of assets.filter((candidate) => candidate.platform === platformContext.added)) {
        addExpected(expectedManagedAction(plan, asset, previousOwnership.get(asset.assetId), false));
      }
    }
  } else if (plan.operation === "uninstall") {
    for (const entry of uninstallActions(plan.root, [...previousOwnership.values()])) addExpected(entry);
  } else if (repairNeeded) {
    for (const asset of assets) addExpected(expectedManagedAction(plan, asset, undefined, false));
  }

  if (replacesLegacy) {
    const legacyHash = treeHash(plan.root, PROJECT_DIR);
    const legacyExternal = legacyExternalAssetActions(plan.root);
    const backupAction = actualByAsset.get(LEGACY_BACKUP_ASSET_ID);
    if (!backupAction || !isControlledSpecialAction(plan, backupAction)) {
      throw new OpenNoriError("plan_invalid", "Legacy replacement needs one controlled backup action.");
    }
    addExpected(
      action("init", LEGACY_BACKUP_ASSET_ID, "create", backupAction.path, "Existing state will be backed up.", {
        destructive: false,
        expected_hash: legacyHash,
        result_hash: legacyHash
      })
    );
    addExpected(
      action("init", LEGACY_STATE_ASSET_ID, "remove", PROJECT_DIR, "Legacy state will be replaced after backup.", {
        destructive: true,
        expected_hash: legacyHash
      })
    );
    for (const entry of legacyExternal.actions) addExpected(entry);
  }

  const manifestExists = fs.existsSync(safeProjectPath(plan.root, INSTALL_MANIFEST_PATH));
  if (plan.operation === "repair" && repairNeeded && manifestExists) {
    const backupAction = actualByAsset.get(MANIFEST_BACKUP_ASSET_ID);
    if (!backupAction || !isControlledSpecialAction(plan, backupAction)) {
      throw new OpenNoriError("plan_invalid", "Manifest repair needs one controlled backup action.");
    }
    const manifestHash = contentHash(readText(safeProjectPath(plan.root, INSTALL_MANIFEST_PATH)));
    addExpected(
      action("repair", MANIFEST_BACKUP_ASSET_ID, "create", backupAction.path, "Current manifest will be backed up.", {
        destructive: false,
        expected_hash: manifestHash,
        result_hash: manifestHash
      })
    );
  }

  for (const expected of expectedByAsset.values()) {
    const actual = actualByAsset.get(expected.asset_id);
    if (!actual) throw new OpenNoriError("plan_invalid", `Lifecycle plan is missing the required action for ${expected.asset_id}.`);
    if (!sameActionSemantics(actual, expected)) {
      throw new OpenNoriError("plan_stale", `Lifecycle action no longer matches current state: ${actual.path}`, {
        recovery: "Build and review a fresh lifecycle plan."
      });
    }
  }
  for (const entry of plan.actions) {
    if (entry.asset_id === MANIFEST_ASSET_ID) continue;
    if (!expectedByAsset.has(entry.asset_id)) {
      throw new OpenNoriError("plan_invalid", `Lifecycle plan contains an unexpected action for ${entry.asset_id}.`);
    }
  }

  for (const entry of plan.actions) {
    if (entry.type !== "create" && entry.type !== "update" && entry.type !== "remove" && entry.type !== "adopt") continue;
    const asset = assetMap.get(entry.asset_id);
    const owned = previousOwnership.get(entry.asset_id);
    if (!asset && !owned && !isControlledSpecialAction(plan, entry)) {
      throw new OpenNoriError("plan_invalid", `Lifecycle action is not bound to a declared asset or ownership record: ${entry.asset_id}`);
    }
    if (owned && owned.path !== entry.path) {
      throw new OpenNoriError("plan_invalid", `Lifecycle action path does not match owned asset ${entry.asset_id}: ${entry.path}`);
    }
    if (asset || owned) {
      const expected = expectedManagedAction(plan, asset, owned, replacesLegacy);
      if (!expected || !sameActionSemantics(entry, expected)) {
        throw new OpenNoriError("plan_stale", `Lifecycle action no longer matches current state: ${entry.path}`, {
          recovery: "Build and review a fresh lifecycle plan."
        });
      }
    }
    if (asset && asset.path !== entry.path) {
      throw new OpenNoriError("plan_invalid", `Lifecycle action path does not match ${entry.asset_id}: ${entry.path}`);
    }
    if (entry.type === "adopt" && (plan.operation !== "repair" || !asset)) {
      throw new OpenNoriError("plan_invalid", `Only manifest repair may adopt a declared asset: ${entry.path}`);
    }
    if (entry.asset_id === MANIFEST_BACKUP_ASSET_ID && plan.operation !== "repair") {
      throw new OpenNoriError("plan_invalid", "Manifest backup actions are only valid during manifest repair.");
    }
    if (entry.result_hash && asset && contentHash(desiredManagedContent(asset)) !== entry.result_hash) {
      throw new OpenNoriError("plan_stale", `Desired content changed after planning: ${entry.path}`);
    }
    if (entry.expected_hash) {
      const currentHash = actionCurrentHash(plan.root, entry, asset);
      if (currentHash !== entry.expected_hash) {
        throw new OpenNoriError("plan_stale", `Managed content changed after planning: ${entry.path}`, {
          recovery: "Build and review a fresh lifecycle plan."
        });
      }
      if (entry.asset_id === MANIFEST_BACKUP_ASSET_ID && fs.existsSync(safeProjectPath(plan.root, entry.path))) {
        throw new OpenNoriError("plan_stale", `Manifest backup target appeared after planning: ${entry.path}`);
      }
      continue;
    }
    if (entry.type === "create") {
      if (entry.asset_id === MANIFEST_ASSET_ID && replacesLegacy) continue;
      if (asset?.path.startsWith(`${PROJECT_DIR}/`) && replacesLegacy) continue;
      if (!asset && fs.existsSync(safeProjectPath(plan.root, entry.path))) {
        throw new OpenNoriError("plan_stale", `Create target appeared after planning: ${entry.path}`);
      }
      const state = asset ? currentAssetState(plan.root, asset) : null;
      if (state?.exists) {
        throw new OpenNoriError("plan_stale", `Create target appeared after planning: ${entry.path}`);
      }
    }
    if (entry.type === "remove" && !entry.expected_hash && !entry.destructive && fs.existsSync(safeProjectPath(plan.root, entry.path))) {
      throw new OpenNoriError("plan_stale", `Removal target appeared after planning: ${entry.path}`, {
        recovery: "Build and review a fresh lifecycle plan."
      });
    }
  }

  const manifestActions = plan.actions.filter((entry) => entry.asset_id === MANIFEST_ASSET_ID);
  if (manifestActions.length !== 1) throw new OpenNoriError("plan_invalid", "Lifecycle plan needs exactly one manifest action.");
  const manifestAction = manifestActions[0] as LifecycleAction;
  const mutatesOwnership = [...expectedByAsset.values()].some((entry) => ["create", "update", "remove", "adopt"].includes(entry.type));
  let allowedManifestTypes: LifecycleAction["type"][];
  if (plan.operation === "init") allowedManifestTypes = [mutatesOwnership ? "create" : "skip"];
  else if (plan.operation === "update") allowedManifestTypes = mutatesOwnership ? ["update"] : ["skip", "update"];
  else if (plan.operation === "platform-add") allowedManifestTypes = mutatesOwnership ? ["update"] : ["skip", "update"];
  else if (plan.operation === "repair") {
    allowedManifestTypes = repairNeeded ? [manifestExists ? "update" : "create"] : ["skip"];
  } else {
    const preservesOwnership = [...expectedByAsset.values()].some((entry) => entry.type === "conflict" || entry.type === "preserve");
    allowedManifestTypes = [preservesOwnership ? "update" : "remove"];
  }
  if (!allowedManifestTypes.includes(manifestAction.type)) {
    throw new OpenNoriError("plan_invalid", `Manifest action ${manifestAction.type} does not match lifecycle ${plan.operation}.`);
  }
  const manifestHash = manifestExists ? contentHash(readText(safeProjectPath(plan.root, INSTALL_MANIFEST_PATH))) : undefined;
  const expectedManifestHash =
    plan.operation === "init" || (plan.operation === "repair" && (!repairNeeded || !manifestExists)) ? undefined : manifestHash;
  const expectedManifestDestructive = plan.operation === "uninstall" && manifestAction.type === "remove";
  if (
    manifestAction.path !== INSTALL_MANIFEST_PATH ||
    manifestAction.expected_hash !== expectedManifestHash ||
    manifestAction.result_hash !== undefined ||
    manifestAction.destructive !== expectedManifestDestructive
  ) {
    throw new OpenNoriError("plan_stale", "Manifest action no longer matches current lifecycle state.", {
      recovery: "Build and review a fresh lifecycle plan."
    });
  }
}

function upsertSection(current: string, asset: ManagedAsset): string {
  if (asset.scope !== "section" || !asset.markers) throw new OpenNoriError("asset_invalid", "Expected a section asset.");
  const desired = desiredManagedContent(asset);
  const bounds = sectionBounds(current, asset.markers);
  if (bounds) {
    return `${current.slice(0, bounds.start)}${desired}${current.slice(bounds.end)}`;
  }
  const trimmed = current.trimEnd();
  return `${trimmed}${trimmed ? "\n\n" : ""}${desired}\n`;
}

function removeSection(root: string, asset: ManagedAsset): void {
  if (asset.scope !== "section" || !asset.markers) throw new OpenNoriError("asset_invalid", "Expected a section asset.");
  const filePath = safeProjectPath(root, asset.path);
  const current = readText(filePath);
  const bounds = sectionBounds(current, asset.markers);
  if (!bounds) return;
  const before = current.slice(0, bounds.start).trimEnd();
  const after = current.slice(bounds.end).trimStart();
  const next = [before, after].filter(Boolean).join("\n\n");
  if (!next) fs.rmSync(filePath);
  else writeTextAtomic(filePath, `${next}\n`);
}

function writeAsset(root: string, asset: ManagedAsset): void {
  const filePath = safeProjectPath(root, asset.path);
  if (asset.scope === "file") {
    writeTextAtomic(filePath, asset.content);
    return;
  }
  const current = fs.existsSync(filePath) ? readText(filePath) : "";
  writeTextAtomic(filePath, upsertSection(current, asset));
}

function removeAsset(root: string, actionValue: LifecycleAction, asset?: ManagedAsset): void {
  const filePath = safeProjectPath(root, actionValue.path);
  if (!fs.existsSync(filePath)) return;
  if (asset?.scope === "section") removeSection(root, asset);
  else fs.rmSync(filePath, { force: true });
}

function ownershipRecord(asset: ManagedAsset, hash: string): OwnershipRecord {
  return {
    asset_id: asset.assetId,
    platform: asset.platform,
    path: asset.path,
    scope: asset.scope,
    policy: asset.policy,
    last_written_hash: hash
  };
}

function removeEmptyProjectDirectories(root: string): void {
  const candidates = [
    `${PROJECT_DIR}/.runtime/sessions`,
    `${PROJECT_DIR}/.runtime/locks`,
    `${PROJECT_DIR}/.runtime`,
    `${PROJECT_DIR}/tasks/archive`,
    `${PROJECT_DIR}/tasks`,
    `${PROJECT_DIR}/spec`,
    `${PROJECT_DIR}/workspace`,
    PROJECT_DIR
  ];
  for (const relativePath of candidates) {
    const fullPath = safeProjectPath(root, relativePath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() && fs.readdirSync(fullPath).length === 0) {
      fs.rmdirSync(fullPath);
    }
  }
}

function removeEmptyRemovedAssetDirectories(root: string, actions: readonly LifecycleAction[]): void {
  const directories = [
    ...new Set(
      actions
        .filter((entry) => entry.type === "remove")
        .map((entry) => path.dirname(entry.path))
        .filter((directory) => directory !== ".")
    )
  ].sort((left, right) => right.length - left.length);

  for (const relativePath of directories) {
    const directory = safeProjectPath(root, relativePath);
    if (
      fs.existsSync(directory) &&
      fs.lstatSync(directory).isDirectory() &&
      !fs.lstatSync(directory).isSymbolicLink() &&
      fs.readdirSync(directory).length === 0
    ) {
      fs.rmdirSync(directory);
    }
  }
}

type LifecycleFileSnapshot = {
  path: string;
  content: Buffer | null;
  mode: number | null;
  applied_hash: string | null;
  kind: "file" | "tree";
  expects_absent: boolean;
  created_directories: string[];
};

function rawContentHash(content: Uint8Array): string {
  return `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`;
}

function expectedAppliedFileHash(root: string, entry: LifecycleAction, asset?: ManagedAsset): string | null {
  if (entry.type !== "create" && entry.type !== "update") return null;
  if (asset) {
    const content =
      asset.scope === "file"
        ? asset.content
        : upsertSection(fs.existsSync(safeProjectPath(root, asset.path)) ? readText(safeProjectPath(root, asset.path)) : "", asset);
    return rawContentHash(Buffer.from(normalizeText(content), "utf8"));
  }
  if (entry.asset_id === MANIFEST_BACKUP_ASSET_ID) {
    return rawContentHash(fs.readFileSync(safeProjectPath(root, INSTALL_MANIFEST_PATH)));
  }
  return null;
}

function missingParentDirectories(root: string, filePath: string): string[] {
  const projectRoot = path.resolve(root);
  const directories: string[] = [];
  let current = path.dirname(filePath);
  while (current !== projectRoot && current.startsWith(`${projectRoot}${path.sep}`)) {
    if (fs.existsSync(current)) break;
    directories.push(current);
    current = path.dirname(current);
  }
  return directories;
}

function captureLifecycleFiles(plan: LifecyclePlan, assets: readonly ManagedAsset[]): LifecycleFileSnapshot[] {
  const snapshots: LifecycleFileSnapshot[] = [];
  const seen = new Set<string>();
  const assetsById = new Map(assets.map((asset) => [asset.assetId, asset]));
  const replacesLegacy = plan.actions.some(
    (entry) => entry.asset_id === LEGACY_STATE_ASSET_ID && entry.type === "remove" && entry.path === PROJECT_DIR
  );
  for (const entry of plan.actions) {
    if (!["create", "update", "remove"].includes(entry.type) || entry.asset_id === LEGACY_STATE_ASSET_ID) continue;
    const filePath = safeProjectPath(plan.root, entry.path);
    if (seen.has(filePath)) continue;
    seen.add(filePath);
    const replacesLegacyProjectPath =
      replacesLegacy && entry.asset_id !== LEGACY_BACKUP_ASSET_ID && entry.path.startsWith(`${PROJECT_DIR}/`);
    if (!fs.existsSync(filePath) || replacesLegacyProjectPath) {
      snapshots.push({
        path: filePath,
        content: null,
        mode: null,
        applied_hash: expectedAppliedFileHash(plan.root, entry, assetsById.get(entry.asset_id)),
        kind: entry.asset_id === LEGACY_BACKUP_ASSET_ID ? "tree" : "file",
        expects_absent: entry.type === "remove",
        created_directories: missingParentDirectories(plan.root, filePath)
      });
      continue;
    }
    if (!fs.statSync(filePath).isFile()) {
      throw new OpenNoriError("lifecycle_snapshot_unsupported", `Cannot snapshot non-file lifecycle target: ${entry.path}`);
    }
    snapshots.push({
      path: filePath,
      content: fs.readFileSync(filePath),
      mode: fs.statSync(filePath).mode,
      applied_hash: expectedAppliedFileHash(plan.root, entry, assetsById.get(entry.asset_id)),
      kind: "file",
      expects_absent: entry.type === "remove",
      created_directories: []
    });
  }
  return snapshots;
}

function rollbackLifecycleFiles(plan: LifecyclePlan, snapshots: readonly LifecycleFileSnapshot[]): void {
  const legacyBackup = plan.actions.find((entry) => entry.asset_id === LEGACY_BACKUP_ASSET_ID && entry.type === "create");
  const errors: Array<{ path: string; cause: string }> = [];
  let preservedLegacyBackup: string | null = null;
  const legacyBackupPath = legacyBackup ? safeProjectPath(plan.root, legacyBackup.path) : null;

  for (const snapshot of [...snapshots].reverse()) {
    if (snapshot.path === legacyBackupPath) continue;
    try {
      if (snapshot.content === null) {
        if (!fs.existsSync(snapshot.path)) continue;
        if (snapshot.kind === "tree") {
          const relativePath = posixRelative(plan.root, snapshot.path);
          if (!fs.lstatSync(snapshot.path).isDirectory() || treeHash(plan.root, relativePath) !== snapshot.applied_hash) {
            throw new OpenNoriError("lifecycle_rollback_conflict", `Created lifecycle tree changed before rollback: ${relativePath}`);
          }
          fs.rmSync(snapshot.path, { recursive: true });
          continue;
        }
        const stat = fs.lstatSync(snapshot.path);
        if (!stat.isFile() || stat.isSymbolicLink() || rawContentHash(fs.readFileSync(snapshot.path)) !== snapshot.applied_hash) {
          throw new OpenNoriError(
            "lifecycle_rollback_conflict",
            `Created lifecycle path changed before rollback: ${posixRelative(plan.root, snapshot.path)}`
          );
        }
        fs.rmSync(snapshot.path);
        continue;
      }

      if (!fs.existsSync(snapshot.path)) {
        if (!snapshot.expects_absent) {
          throw new OpenNoriError(
            "lifecycle_rollback_conflict",
            `Updated lifecycle path was removed before rollback: ${posixRelative(plan.root, snapshot.path)}`
          );
        }
        writeBufferAtomic(snapshot.path, snapshot.content, snapshot.mode ?? undefined);
        continue;
      }
      const stat = fs.lstatSync(snapshot.path);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new OpenNoriError(
          "lifecycle_rollback_conflict",
          `Lifecycle path is no longer a regular file: ${posixRelative(plan.root, snapshot.path)}`
        );
      }
      const currentHash = rawContentHash(fs.readFileSync(snapshot.path));
      const originalHash = rawContentHash(snapshot.content);
      if (currentHash === originalHash) continue;
      if (!snapshot.applied_hash || currentHash !== snapshot.applied_hash) {
        throw new OpenNoriError(
          "lifecycle_rollback_conflict",
          `Lifecycle path changed outside this operation: ${posixRelative(plan.root, snapshot.path)}`
        );
      }
      writeBufferAtomic(snapshot.path, snapshot.content, snapshot.mode ?? undefined);
    } catch (error) {
      errors.push({ path: posixRelative(plan.root, snapshot.path), cause: error instanceof Error ? error.message : String(error) });
    }
  }
  const createdDirectories = [...new Set(snapshots.flatMap((snapshot) => snapshot.created_directories))].sort(
    (left, right) => right.length - left.length
  );
  for (const directory of createdDirectories) {
    if (
      fs.existsSync(directory) &&
      fs.lstatSync(directory).isDirectory() &&
      !fs.lstatSync(directory).isSymbolicLink() &&
      fs.readdirSync(directory).length === 0
    ) {
      fs.rmdirSync(directory);
    }
  }
  removeEmptyProjectDirectories(plan.root);
  if (legacyBackup && legacyBackupPath) {
    const sourcePath = safeProjectPath(plan.root, PROJECT_DIR);
    let sourceMatches = false;
    let backupMatches = false;
    let sourceInspectionError: string | null = null;
    let backupInspectionError: string | null = null;
    try {
      sourceMatches = fs.existsSync(sourcePath) && treeHash(plan.root, PROJECT_DIR) === legacyBackup.result_hash;
    } catch (error) {
      sourceInspectionError = error instanceof Error ? error.message : String(error);
    }
    try {
      backupMatches = fs.existsSync(legacyBackupPath) && treeHash(plan.root, legacyBackup.path) === legacyBackup.result_hash;
    } catch (error) {
      backupInspectionError = error instanceof Error ? error.message : String(error);
    }
    if (!sourceMatches && backupMatches && !fs.existsSync(sourcePath)) {
      try {
        fs.cpSync(legacyBackupPath, sourcePath, { recursive: true, force: false, errorOnExist: true });
        if (treeHash(plan.root, PROJECT_DIR) !== legacyBackup.result_hash) {
          throw new OpenNoriError("write_verification_failed", "Restored legacy state does not match its reviewed backup.");
        }
        fs.rmSync(legacyBackupPath, { recursive: true });
      } catch (error) {
        preservedLegacyBackup = legacyBackupPath;
        errors.push({ path: legacyBackup.path, cause: error instanceof Error ? error.message : String(error) });
      }
    } else if (sourceMatches && backupMatches) {
      try {
        fs.rmSync(legacyBackupPath, { recursive: true });
      } catch (error) {
        preservedLegacyBackup = legacyBackupPath;
        errors.push({ path: legacyBackup.path, cause: error instanceof Error ? error.message : String(error) });
      }
    } else {
      preservedLegacyBackup = legacyBackupPath;
      errors.push({
        path: legacyBackup.path,
        cause:
          [sourceInspectionError, backupInspectionError].filter(Boolean).join("; ") ||
          (!fs.existsSync(sourcePath)
            ? "Legacy backup is missing or no longer matches the reviewed plan."
            : "New project state could not be removed safely before legacy restoration.")
      });
    }
  }
  if (errors.length > 0) {
    throw new OpenNoriError("lifecycle_rollback_incomplete", "One or more lifecycle paths could not be restored.", {
      context: { errors, preserved_legacy_backup: preservedLegacyBackup ? posixRelative(plan.root, preservedLegacyBackup) : null }
    });
  }
}

/** Apply an already reviewed plan under one project lock with file rollback. */
export function applyLifecyclePlan(
  plan: LifecyclePlan,
  assets: readonly ManagedAsset[],
  { confirm = false, productVersion = currentProductVersion() }: { confirm?: boolean; productVersion?: string } = {}
): InstallManifest | null {
  if (!confirm) {
    throw new OpenNoriError("confirmation_required", "Lifecycle plans are read-only until confirm is explicitly true.");
  }
  if (plan.state_migration) {
    throw new OpenNoriError("state_migration_required", "Apply project updates through updateProject so the reviewed state migration runs before managed assets.");
  }
  validateAssetCatalog(assets);
  preflight(plan, assets);
  return withExclusiveLock(safeProjectPath(plan.root, ".opennori-lifecycle"), `lifecycle ${plan.operation}`, () => {
    return withProjectRuntimeLock(plan.root, `lifecycle runtime ${plan.operation}`, () => {
      preflight(plan, assets);
      const snapshots = captureLifecycleFiles(plan, assets);
      try {
        return applyLifecyclePlanCore(plan, assets, { confirm: true, productVersion });
      } catch (error) {
        try {
          rollbackLifecycleFiles(plan, snapshots);
        } catch (rollbackError) {
          const rollbackFailure = asOpenNoriError(rollbackError);
          throw new OpenNoriError("lifecycle_rollback_failed", `Lifecycle ${plan.operation} failed and rollback was incomplete.`, {
            context: {
              operation_error: error instanceof Error ? error.message : String(error),
              rollback_error: rollbackFailure.message,
              rollback_context: rollbackFailure.context
            },
            recovery: "Stop lifecycle writes, inspect the reported paths, and restore them from version control or the created backup."
          });
        }
        throw error;
      }
    });
  });
}

function applyLifecyclePlanCore(
  plan: LifecyclePlan,
  assets: readonly ManagedAsset[],
  { confirm = false, productVersion = currentProductVersion() }: { confirm?: boolean; productVersion?: string } = {}
): InstallManifest | null {
  if (!confirm) {
    throw new OpenNoriError("confirmation_required", "Lifecycle plans are read-only until confirm is explicitly true.");
  }
  validateAssetCatalog(assets);
  preflight(plan, assets);

  const assetMap = new Map(assets.map((asset) => [asset.assetId, asset]));
  let previousManifest: InstallManifest | null = null;
  if (plan.operation !== "init" && plan.operation !== "repair") previousManifest = readInstallManifest(plan.root);
  if (plan.operation === "repair") {
    try {
      previousManifest = readInstallManifest(plan.root);
    } catch {
      previousManifest = null;
    }
  }
  const records =
    plan.operation === "repair"
      ? new Map<string, OwnershipRecord>()
      : previousManifest
        ? ownershipByAsset(previousManifest, assets)
        : new Map<string, OwnershipRecord>();
  let manifestAction: LifecycleAction | undefined;

  for (const entry of plan.actions) {
    if (entry.asset_id === MANIFEST_ASSET_ID) {
      manifestAction = entry;
      continue;
    }
    if (entry.asset_id === LEGACY_BACKUP_ASSET_ID && entry.type === "create") {
      const source = safeProjectPath(plan.root, PROJECT_DIR);
      const target = safeProjectPath(plan.root, entry.path);
      fs.cpSync(source, target, { recursive: true, force: false, errorOnExist: true });
      const sourceHash = treeHash(plan.root, PROJECT_DIR);
      const targetHash = treeHash(plan.root, entry.path);
      if (sourceHash !== entry.result_hash || targetHash !== entry.result_hash) {
        throw new OpenNoriError("write_verification_failed", `Legacy backup changed while copying: ${entry.path}`);
      }
      continue;
    }
    if (entry.asset_id === MANIFEST_BACKUP_ASSET_ID && entry.type === "create") {
      const source = safeProjectPath(plan.root, INSTALL_MANIFEST_PATH);
      const target = safeProjectPath(plan.root, entry.path);
      fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
      if (contentHash(readText(target)) !== entry.result_hash) {
        throw new OpenNoriError("write_verification_failed", `Manifest backup hash does not match the plan: ${entry.path}`);
      }
      continue;
    }
    if (entry.asset_id === LEGACY_STATE_ASSET_ID && entry.type === "remove") {
      fs.rmSync(safeProjectPath(plan.root, PROJECT_DIR), { recursive: true, force: true });
      records.clear();
      continue;
    }

    const asset = assetMap.get(entry.asset_id);
    if (entry.type === "adopt" && asset) {
      const state = currentAssetState(plan.root, asset);
      if (!state.managedHash || state.managedHash !== entry.result_hash) {
        throw new OpenNoriError("write_verification_failed", `Adopted asset hash does not match the plan: ${entry.path}`);
      }
      records.set(asset.assetId, ownershipRecord(asset, state.managedHash));
      continue;
    }
    if ((entry.type === "create" || entry.type === "update") && asset) {
      writeAsset(plan.root, asset);
      const state = currentAssetState(plan.root, asset);
      const writtenHash = state.managedHash;
      if (!writtenHash || writtenHash !== entry.result_hash) {
        throw new OpenNoriError("write_verification_failed", `Written asset hash does not match the plan: ${entry.path}`);
      }
      records.set(asset.assetId, ownershipRecord(asset, writtenHash));
      continue;
    }
    if (entry.type === "remove") {
      const removalAsset = asset || (records.get(entry.asset_id)?.scope === "section" ? knownSectionAsset(records.get(entry.asset_id) as OwnershipRecord) || undefined : undefined);
      removeAsset(plan.root, entry, removalAsset);
      records.delete(entry.asset_id);
      continue;
    }
    if (plan.operation === "uninstall" && entry.type === "skip") records.delete(entry.asset_id);
  }

  if (plan.operation === "uninstall") removeEmptyRemovedAssetDirectories(plan.root, plan.actions);
  if (!manifestAction) throw new OpenNoriError("plan_invalid", "Lifecycle plan does not contain a manifest action.");
  if (plan.operation === "uninstall" && manifestAction.type === "remove") {
    fs.rmSync(safeProjectPath(plan.root, INSTALL_MANIFEST_PATH), { force: true });
    removeEmptyProjectDirectories(plan.root);
    return null;
  }
  if (manifestAction.type === "skip") return previousManifest;

  const timestamp = nowIso();
  const platforms = [...new Set(assets.filter((asset) => asset.platform !== "core").map((asset) => asset.platform))] as PlatformId[];
  const manifest: InstallManifest = {
    schema_version: "opennori/install-manifest-v1",
    product_version: productVersion,
    state_schema_version: plan.state_schema_version ?? CURRENT_STATE_SCHEMA_VERSION,
    platforms: platforms.length > 0 ? platforms : previousManifest?.platforms || ["codex"],
    assets: [...records.values()].sort((left, right) => left.asset_id.localeCompare(right.asset_id)),
    created_at: previousManifest?.created_at || timestamp,
    updated_at: timestamp
  };
  assertSchema<InstallManifest>("manifest", manifest);
  writeJsonAtomic(safeProjectPath(plan.root, INSTALL_MANIFEST_PATH), manifest);
  return manifest;
}

export function initProject(root: string, options: InitOptions): LifecycleRunResult {
  const productVersion = options.productVersion || currentProductVersion();
  const platforms = options.platforms ?? ["codex"];
  const config = createProjectConfig(options.developer, platforms);
  const assets = projectAssets(config);
  const plan = planInit(root, options.developer, productVersion, platforms);
  if (!options.confirm) return { plan, applied: false };
  return {
    plan,
    applied: true,
    manifest: applyLifecyclePlan(plan, assets, { confirm: true, productVersion })
  };
}

/** Return a read-only update plan unless confirm is explicitly true. */
export function updateProject(root: string, options: UpdateOptions = {}): LifecycleRunResult {
  const productVersion = options.productVersion || currentProductVersion();
  const plan = planUpdate(root, productVersion);
  if (!options.confirm) return { plan, applied: false };
  if (plan.blockers.length > 0) {
    throw new OpenNoriError("update_blocked", plan.blockers.join(" "), {
      context: { blockers: plan.blockers },
      recovery: "Resolve the reported state conflict, then preview the update again."
    });
  }
  if (plan.state_migration) applyStateMigration(root, plan.state_migration);
  const config: ProjectConfig = readProjectConfig(root);
  const currentPlan = planUpdate(root, productVersion);
  return {
    plan,
    applied: true,
    manifest: applyLifecyclePlan(currentPlan, projectAssets(config), { confirm: true, productVersion })
  };
}

/** Add one project adapter through the reviewed lifecycle plan. */
export function addProjectPlatform(
  root: string,
  platform: PlatformId,
  options: PlatformAddOptions = {}
): LifecycleRunResult {
  const productVersion = options.productVersion || currentProductVersion();
  const plan = planPlatformAdd(root, platform, productVersion);
  if (!options.confirm) return { plan, applied: false };
  if (plan.blockers.length > 0) {
    throw new OpenNoriError("platform_add_blocked", plan.blockers.join(" "), {
      context: { blockers: plan.blockers },
      recovery: "Resolve every target adapter conflict, then preview the platform addition again."
    });
  }
  const currentConfig = readProjectConfig(root);
  if (currentConfig.platforms.includes(platform)) {
    return { plan, applied: false, manifest: readInstallManifest(root) };
  }
  const targetConfig: ProjectConfig = { ...currentConfig, platforms: [...currentConfig.platforms, platform] };
  const currentPlan = planPlatformAdd(root, platform, productVersion);
  return {
    plan: currentPlan,
    applied: true,
    manifest: applyLifecyclePlan(currentPlan, projectAssets(targetConfig), { confirm: true, productVersion })
  };
}

/** Return a read-only manifest repair plan unless confirm is explicitly true. */
export function repairProjectManifest(root: string, options: RepairOptions = {}): LifecycleRunResult {
  const productVersion = options.productVersion || currentProductVersion();
  const plan = planManifestRepair(root, productVersion);
  if (!options.confirm) return { plan, applied: false };
  const config = readProjectConfig(root);
  return {
    plan,
    applied: true,
    manifest: applyLifecyclePlan(plan, projectAssets(config), { confirm: true, productVersion })
  };
}

export function uninstallProject(root: string, options: UninstallOptions = {}): LifecycleRunResult {
  const plan = planUninstall(root);
  if (!options.confirm) return { plan, applied: false };
  return withExclusiveLock(safeProjectPath(plan.root, ".opennori-lifecycle"), "lifecycle uninstall", () =>
    withProjectRuntimeLock(plan.root, "lifecycle runtime uninstall", () => {
      const currentPlan = planUninstall(plan.root);
      const assets = projectAssets(readProjectConfig(plan.root));
      return {
        plan: currentPlan,
        applied: true,
        manifest: applyLifecyclePlan(currentPlan, assets, { confirm: true })
      };
    })
  );
}
