import fs from "node:fs";
import path from "node:path";
import { inspectClaudeHost } from "./claude-host.ts";
import { inspectCodexPlugin } from "./codex-plugin.ts";
import { asOpenNoriError, OpenNoriError } from "./errors.ts";
import { contentHash, posixRelative, readText, safeProjectPath } from "./io.ts";
import { inspectManagedAsset, type AssetInspection, validateManifestOwnership } from "./lifecycle.ts";
import { platformDisplayName } from "./platform.ts";
import {
  INSTALL_MANIFEST_PATH,
  CURRENT_STATE_SCHEMA_VERSION,
  PROJECT_CONFIG_PATH,
  PROJECT_DIR,
  assertDistinctProjectPackageDirectories,
  currentProductVersion,
  inspectProjectInstallation,
  projectPackageDirectory,
  projectAssets,
  projectPaths,
  readInstallManifest,
  readProjectConfig
} from "./project.ts";
import { inspectGlobalCli } from "./setup.ts";
import { loadTaskLocationAt, loadTaskViewAt } from "./task.ts";
import type { DoctorCheck, DoctorResult, InstallManifest, OwnershipRecord, PlatformId, ProjectConfig } from "./types.ts";

type MutableDiagnosis = {
  checks: DoctorCheck[];
  broken: boolean;
};

function diagnoseGlobalCli(root: string, diagnosis: MutableDiagnosis): void {
  try {
    const inspection = inspectGlobalCli(root, currentProductVersion());
    const issues = [
      inspection.installed_version !== inspection.expected_version ? "installed package version does not match" : null,
      !inspection.executable_ready ? "global executable does not report the expected version" : null,
      !inspection.path_ready ? "global executable directory is not on PATH" : null,
      !inspection.command_ready ? "the bare opennori command does not report the expected version" : null
    ].filter(Boolean);
    addCheck(diagnosis, {
      id: "host.opennori-cli",
      ok: inspection.ready,
      message: inspection.ready
        ? `The persistent OpenNori CLI version is ${inspection.installed_version}.`
        : `The persistent OpenNori CLI is not ready: ${issues.join("; ")}.`,
      recovery: inspection.ready
        ? undefined
        : inspection.installed_version !== inspection.expected_version
          ? "Run npx opennori setup to install the matching persistent CLI."
          : !inspection.path_ready
            ? `Add ${inspection.executable_path ? path.dirname(inspection.executable_path) : "the npm global bin directory"} to PATH, then rerun opennori doctor.`
            : "Run the reported global executable and 'opennori --version' directly, resolve the mismatch, then rerun opennori doctor."
    });
  } catch (error) {
    const failure = asOpenNoriError(error);
    addCheck(diagnosis, {
      id: "host.opennori-cli",
      ok: false,
      message: failure.message,
      recovery: failure.recovery || "Install npm, then rerun npx opennori setup."
    });
  }
}

function diagnoseCodexPlugin(root: string, diagnosis: MutableDiagnosis): void {
  try {
    const inspection = inspectCodexPlugin(root, currentProductVersion());
    addCheck(diagnosis, {
      id: "codex.cli",
      ok: true,
      message: "Codex CLI Plugin commands are available."
    });
    addCheck(diagnosis, {
      id: "codex.marketplace",
      ok: inspection.marketplace_present && inspection.marketplace_source_valid,
      message: !inspection.marketplace_present
        ? "The OpenNori Codex marketplace is not configured."
        : inspection.marketplace_source_valid
          ? "The OpenNori Codex marketplace source is configured."
          : "A different source is using the OpenNori marketplace name.",
      recovery:
        inspection.marketplace_present && inspection.marketplace_source_valid
          ? undefined
          : "Review 'codex plugin marketplace list --json', then rerun npx opennori setup."
    });
    addCheck(diagnosis, {
      id: "codex.plugin.installed",
      ok: inspection.installed,
      message: inspection.installed ? "The OpenNori Codex Plugin is installed." : "The OpenNori Codex Plugin is not installed.",
      recovery: inspection.installed ? undefined : "Run npx opennori setup to install the Plugin through the Codex CLI."
    });
    addCheck(diagnosis, {
      id: "codex.plugin.enabled",
      ok: inspection.enabled,
      message: inspection.enabled ? "The OpenNori Codex Plugin is enabled." : "The OpenNori Codex Plugin is not enabled.",
      recovery: inspection.enabled ? undefined : "Reinstall the OpenNori Plugin through the Codex CLI, then open a new conversation."
    });
    addCheck(diagnosis, {
      id: "codex.plugin.version",
      ok: inspection.version === inspection.expected_version,
      message:
        inspection.version === inspection.expected_version
          ? `The OpenNori Codex Plugin version is ${inspection.version}.`
          : `Codex exposes OpenNori ${inspection.version ?? "without a version"}; this CLI expects ${inspection.expected_version}.`,
      recovery:
        inspection.version === inspection.expected_version
          ? undefined
          : "Upgrade the OpenNori marketplace and reinstall the matching Plugin version."
    });
  } catch (error) {
    const failure = asOpenNoriError(error);
    addCheck(diagnosis, {
      id: "codex.cli",
      ok: false,
      message: failure.message,
      recovery: failure.recovery || "Install or update the Codex CLI, then rerun npx opennori setup."
    });
  }
}

function diagnoseClaudeHost(root: string, diagnosis: MutableDiagnosis): void {
  const inspection = inspectClaudeHost(root);
  addCheck(diagnosis, {
    id: "claude.cli",
    ok: inspection.ready,
    message: inspection.ready
      ? `Claude Code is available (${inspection.version}).`
      : "Claude Code is not available on PATH.",
    recovery: inspection.ready
      ? undefined
      : "Install or update Claude Code, then rerun npx opennori setup --platform claude."
  });
}

function diagnosePlatformHost(root: string, platform: PlatformId, diagnosis: MutableDiagnosis): void {
  if (platform === "codex") diagnoseCodexPlugin(root, diagnosis);
  else diagnoseClaudeHost(root, diagnosis);
}

function addCheck(diagnosis: MutableDiagnosis, check: DoctorCheck, { broken = false } = {}): void {
  diagnosis.checks.push(check);
  if (!check.ok && broken) diagnosis.broken = true;
}

function diagnoseConfig(root: string, diagnosis: MutableDiagnosis): ProjectConfig | null {
  const filePath = path.join(root, PROJECT_CONFIG_PATH);
  if (!fs.existsSync(filePath)) {
    addCheck(diagnosis, {
      id: "project.config",
      ok: false,
      message: `${PROJECT_CONFIG_PATH} is missing.`,
      recovery: "Run opennori init --user <name>."
    });
    return null;
  }
  try {
    const config = readProjectConfig(root);
    addCheck(diagnosis, {
      id: "project.config",
      ok: true,
      message: `${PROJECT_CONFIG_PATH} is readable and schema-valid.`
    });
    for (const platform of config.platforms) {
      addCheck(diagnosis, {
        id: `project.platform.${platform}`,
        ok: true,
        message: `${platformDisplayName(platform)} is configured for this project.`
      });
    }
    for (const packageId of Object.keys(config.packages ?? {})) {
      try {
        const directory = projectPackageDirectory(root, config, packageId);
        addCheck(diagnosis, {
          id: `project.package.${packageId}`,
          ok: true,
          message: `${packageId}: ${posixRelative(root, directory)} is available.`
        });
      } catch (error) {
        const failure = asOpenNoriError(error);
        addCheck(
          diagnosis,
          {
            id: `project.package.${packageId}`,
            ok: false,
            message: failure.message,
            recovery: failure.recovery
          },
          { broken: failure.code === "unsafe_path" }
        );
      }
    }
    try {
      assertDistinctProjectPackageDirectories(root, config);
      if (config.packages) {
        addCheck(diagnosis, {
          id: "project.packages.distinct",
          ok: true,
          message: "Registered packages resolve to distinct directories."
        });
      }
    } catch (error) {
      const failure = asOpenNoriError(error);
      addCheck(
        diagnosis,
        {
          id: "project.packages.distinct",
          ok: false,
          message: failure.message,
          recovery: failure.recovery
        },
        { broken: true }
      );
    }
    return config;
  } catch (error) {
    const failure = asOpenNoriError(error);
    addCheck(
      diagnosis,
      {
        id: "project.config",
        ok: false,
        message: failure.message,
        recovery: failure.recovery || "Repair the project config, then rerun opennori doctor."
      },
      { broken: true }
    );
    return null;
  }
}

function diagnoseManifest(root: string, config: ProjectConfig | null, diagnosis: MutableDiagnosis): InstallManifest | null {
  const filePath = path.join(root, INSTALL_MANIFEST_PATH);
  if (!fs.existsSync(filePath)) {
    addCheck(
      diagnosis,
      {
        id: "project.manifest",
        ok: false,
        message: `${INSTALL_MANIFEST_PATH} is missing.`,
        recovery: config
          ? "Restore the manifest or preview 'opennori update --repair-manifest --dry-run'."
          : "Run opennori init --user <name>."
      },
      { broken: config !== null }
    );
    return null;
  }
  try {
    const manifest = readInstallManifest(root);
    addCheck(diagnosis, {
      id: "project.manifest",
      ok: true,
      message: `${INSTALL_MANIFEST_PATH} is readable and schema-valid.`
    });
    addCheck(diagnosis, {
      id: "project.state-schema",
      ok: manifest.state_schema_version === CURRENT_STATE_SCHEMA_VERSION,
      message:
        manifest.state_schema_version === CURRENT_STATE_SCHEMA_VERSION
          ? `Project state schema ${manifest.state_schema_version} is current.`
          : manifest.state_schema_version > CURRENT_STATE_SCHEMA_VERSION
            ? `Project state schema ${manifest.state_schema_version} needs a newer OpenNori CLI; this CLI supports ${CURRENT_STATE_SCHEMA_VERSION}.`
            : `Project state schema ${manifest.state_schema_version} needs migration to ${CURRENT_STATE_SCHEMA_VERSION}.`,
      recovery:
        manifest.state_schema_version === CURRENT_STATE_SCHEMA_VERSION
          ? undefined
          : manifest.state_schema_version > CURRENT_STATE_SCHEMA_VERSION
            ? "Run npx opennori setup with the project-compatible version, then rerun Doctor."
            : "Run opennori update --dry-run, review the state migration, then rerun with --confirm."
    });
    if (config) {
      const configPlatforms = [...config.platforms].sort().join(",");
      const manifestPlatforms = [...manifest.platforms].sort().join(",");
      addCheck(
        diagnosis,
        {
          id: "project.manifest.platforms",
          ok: configPlatforms === manifestPlatforms,
          message:
            configPlatforms === manifestPlatforms
              ? "Project config and install manifest agree on configured platforms."
              : "Project config and install manifest disagree on configured platforms.",
          recovery:
            configPlatforms === manifestPlatforms
              ? undefined
              : "Restore config.yaml platforms to the installed manifest values before any repair. Remove the old adapter through uninstall before configuring a different platform."
        },
        { broken: configPlatforms !== manifestPlatforms }
      );
    }
    return manifest;
  } catch (error) {
    const failure = asOpenNoriError(error);
    addCheck(
      diagnosis,
      {
        id: "project.manifest",
        ok: false,
        message: failure.message,
        recovery: "Preview 'opennori update --repair-manifest --dry-run', then confirm only after reviewing reconstructed ownership."
      },
      { broken: true }
    );
    return null;
  }
}

function diagnoseLayout(root: string, diagnosis: MutableDiagnosis): void {
  const paths = projectPaths(root);
  const required = [
    ["layout.project", paths.project, PROJECT_DIR],
    ["layout.spec", paths.spec, `${PROJECT_DIR}/spec`],
    ["layout.tasks", paths.tasks, `${PROJECT_DIR}/tasks`],
    ["layout.workspace", paths.workspace, `${PROJECT_DIR}/workspace`],
    ["layout.runtime", paths.runtime, `${PROJECT_DIR}/.runtime`]
  ] as const;
  for (const [id, fullPath, displayPath] of required) {
    const ok = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    addCheck(diagnosis, {
      id,
      ok,
      message: ok ? `${displayPath}/ is present.` : `${displayPath}/ is missing or is not a directory.`,
      recovery: ok ? undefined : "Review opennori update, then confirm it if the plan is correct."
    });
  }
}

function diagnoseTaskDirectory(
  root: string,
  directory: string,
  archived: boolean,
  diagnosis: MutableDiagnosis,
  config: ProjectConfig | null
): void {
  const relativePath = posixRelative(root, directory);
  try {
    const location = loadTaskLocationAt(directory, archived);
    const view = loadTaskViewAt(location);
    if (archived && view.task.status !== "completed") {
      throw new OpenNoriError("archived_task_incomplete", `Archived task ${view.task.id} is ${view.task.status}.`);
    }
    if (view.task.status === "completed" && !view.complete) {
      throw new OpenNoriError("completed_task_unproven", `Completed task ${view.task.id} no longer has complete required Evidence.`);
    }
    addCheck(diagnosis, {
      id: `task.${view.task.id}`,
      ok: true,
      message: `${relativePath}: task, Contract, and Evidence are valid.`
    });
    if (!archived && view.task.package && config) {
      try {
        const packageDirectory = projectPackageDirectory(root, config, view.task.package);
        addCheck(diagnosis, {
          id: `task.${view.task.id}.package`,
          ok: true,
          message: `${view.task.package}: ${posixRelative(root, packageDirectory)} is available for this task.`
        });
      } catch (error) {
        const failure = asOpenNoriError(error);
        addCheck(
          diagnosis,
          {
            id: `task.${view.task.id}.package`,
            ok: false,
            message: `${relativePath}: ${failure.message}`,
            recovery: failure.recovery
          },
          { broken: failure.code === "unsafe_path" }
        );
      }
    }
  } catch (error) {
    const failure = asOpenNoriError(error);
    addCheck(
      diagnosis,
      {
        id: `task.invalid.${relativePath}`,
        ok: false,
        message: `${relativePath}: ${failure.message}`,
        recovery: "Restore the task directory from version control or a reviewed backup before continuing it."
      },
      { broken: true }
    );
  }
}

function diagnoseTasks(root: string, diagnosis: MutableDiagnosis, config: ProjectConfig | null): void {
  const tasksRoot = safeProjectPath(root, `${PROJECT_DIR}/tasks`);
  if (!fs.existsSync(tasksRoot) || !fs.statSync(tasksRoot).isDirectory()) return;
  for (const entry of fs.readdirSync(tasksRoot, { withFileTypes: true })) {
    if (entry.name === "archive") continue;
    const directory = safeProjectPath(root, `${PROJECT_DIR}/tasks/${entry.name}`);
    if (entry.isDirectory()) diagnoseTaskDirectory(root, directory, false, diagnosis, config);
  }

  const archiveRoot = safeProjectPath(root, `${PROJECT_DIR}/tasks/archive`);
  if (!fs.existsSync(archiveRoot) || !fs.statSync(archiveRoot).isDirectory()) return;
  for (const month of fs.readdirSync(archiveRoot, { withFileTypes: true })) {
    if (month.name === ".gitkeep") continue;
    if (!month.isDirectory() || !/^\d{4}-\d{2}$/.test(month.name)) {
      addCheck(
        diagnosis,
        {
          id: `task.archive.invalid.${month.name}`,
          ok: false,
          message: `${PROJECT_DIR}/tasks/archive/${month.name} is not a valid archive month directory.`,
          recovery: "Move the unknown archive entry outside the task root after preserving it."
        },
        { broken: true }
      );
      continue;
    }
    for (const entry of fs.readdirSync(path.join(archiveRoot, month.name), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      diagnoseTaskDirectory(root, safeProjectPath(root, `${PROJECT_DIR}/tasks/archive/${month.name}/${entry.name}`), true, diagnosis, config);
    }
  }
}

function diagnoseDesiredAssets(
  root: string,
  config: ProjectConfig,
  manifest: InstallManifest,
  diagnosis: MutableDiagnosis
): void {
  const desired = projectAssets(config);
  let records: Map<string, OwnershipRecord>;
  try {
    records = validateManifestOwnership(manifest, desired);
  } catch (error) {
    addCheck(
      diagnosis,
      {
        id: "manifest.ownership",
        ok: false,
        message: asOpenNoriError(error).message,
        recovery: "Preview 'opennori update --repair-manifest --dry-run', then confirm only after reviewing reconstructed ownership."
      },
      { broken: true }
    );
    return;
  }
  const desiredIds = new Set(desired.map((asset) => asset.assetId));
  for (const asset of desired) {
    let inspection: AssetInspection;
    try {
      inspection = inspectManagedAsset(root, asset, records.get(asset.assetId));
    } catch (error) {
      addCheck(
        diagnosis,
        {
          id: `asset.${asset.assetId}`,
          ok: false,
          message: asOpenNoriError(error).message,
          recovery: "Resolve the unsafe or unreadable path before running lifecycle commands."
        },
        { broken: true }
      );
      continue;
    }
    const ok =
      inspection.status === "current" ||
      inspection.status === "unowned" ||
      (asset.policy === "seed" && ["modified", "stale"].includes(inspection.status));
    addCheck(diagnosis, {
      id: `asset.${asset.assetId}`,
      ok,
      message:
        asset.policy === "seed" && ok && inspection.status !== "current"
          ? `${asset.path}: Seeded project content is user-owned and preserved.`
          : `${asset.path}: ${inspection.reason}`,
      recovery: ok
        ? undefined
        : inspection.status === "modified"
          ? "Review the local change. OpenNori update and uninstall will preserve it."
          : "Run opennori update to preview the required managed asset changes."
    });
  }

  for (const record of manifest.assets) {
    if (desiredIds.has(record.asset_id)) continue;
    let filePath: string;
    try {
      filePath = safeProjectPath(root, record.path);
    } catch (error) {
      addCheck(
        diagnosis,
        {
          id: `asset.${record.asset_id}`,
          ok: false,
          message: asOpenNoriError(error).message,
          recovery: "Remove the unsafe manifest entry only after manually verifying project state."
        },
        { broken: true }
      );
      continue;
    }
    const exists = fs.existsSync(filePath);
    const currentHash = exists && fs.statSync(filePath).isFile() && record.scope === "file" ? contentHash(readText(filePath)) : null;
    addCheck(diagnosis, {
      id: `asset.${record.asset_id}`,
      ok: false,
      message:
        !exists
          ? `${record.path}: obsolete ownership record points to absent content.`
          : currentHash === record.last_written_hash
            ? `${record.path}: unmodified obsolete managed asset is ready for update cleanup.`
            : `${record.path}: obsolete managed content requires review and will be preserved.`,
      recovery: "Run opennori update to preview obsolete ownership cleanup."
    });
  }
}

/** Diagnose project config, ownership manifest, layout, and every desired managed asset without writing. */
export function doctor(root: string): DoctorResult {
  const projectRoot = path.resolve(root);
  const diagnosis: MutableDiagnosis = { checks: [], broken: false };
  diagnoseGlobalCli(projectRoot, diagnosis);
  const installation = inspectProjectInstallation(projectRoot);
  if (installation.state === "legacy") {
    diagnosePlatformHost(projectRoot, "codex", diagnosis);
    addCheck(diagnosis, {
      id: "project.foundation-migration",
      ok: false,
      message: "This project uses the previous OpenNori foundation and needs a reviewed migration.",
      recovery:
        "Run opennori init --user <name> --dry-run, review the state backup and legacy hook cleanup, then rerun with --confirm and run opennori doctor."
    });
    return { status: "needs_action", checks: diagnosis.checks };
  }
  const config = diagnoseConfig(projectRoot, diagnosis);
  const manifest = diagnoseManifest(projectRoot, config, diagnosis);
  for (const platform of config?.platforms ?? ["codex"]) diagnosePlatformHost(projectRoot, platform, diagnosis);

  if (config || manifest || fs.existsSync(path.join(projectRoot, PROJECT_DIR))) {
    try {
      diagnoseLayout(projectRoot, diagnosis);
    } catch (error) {
      addCheck(
        diagnosis,
        {
          id: "project.layout",
          ok: false,
          message: asOpenNoriError(error).message,
          recovery: "Remove project-root symlinks or path escapes before running OpenNori."
        },
        { broken: true }
      );
    }
  }
  if (config && manifest) diagnoseDesiredAssets(projectRoot, config, manifest, diagnosis);
  if (fs.existsSync(path.join(projectRoot, PROJECT_DIR)) && manifest?.state_schema_version === CURRENT_STATE_SCHEMA_VERSION) {
    diagnoseTasks(projectRoot, diagnosis, config);
  }

  const hasFailures = diagnosis.checks.some((check) => !check.ok);
  return {
    status: diagnosis.broken ? "broken" : hasFailures ? "needs_action" : "ready",
    checks: diagnosis.checks
  };
}

export const doctorProject = doctor;
