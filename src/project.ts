import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { OpenNoriError } from "./errors.ts";
import { readJson, readText, safeProjectPath } from "./io.ts";
import { packagePath } from "./package-root.ts";
import { projectPlatformAssets } from "./platform.ts";
import type { InstallManifest, ManagedAsset, PlatformId, ProjectConfig } from "./types.ts";
import { assertSchema } from "./validation.ts";

export const PROJECT_DIR = ".opennori";
export const CURRENT_STATE_SCHEMA_VERSION = 2 as const;
export const PROJECT_CONFIG_PATH = `${PROJECT_DIR}/config.yaml`;
export const INSTALL_MANIFEST_PATH = `${PROJECT_DIR}/manifest.json`;
export const WORKFLOW_PATH = `${PROJECT_DIR}/workflow.md`;
export const GITIGNORE_PATH = ".gitignore";

export const GITIGNORE_SECTION_MARKERS = {
  start: "# OPENNORI:START",
  end: "# OPENNORI:END"
} as const;

export type ProjectPaths = {
  root: string;
  project: string;
  config: string;
  manifest: string;
  workflow: string;
  spec: string;
  tasks: string;
  workspace: string;
  runtime: string;
};

export type ProjectInstallationInspection = {
  state: "absent" | "foundation" | "damaged_foundation" | "legacy";
  reason: string;
};

/** Return the canonical project layout without creating it. */
export function projectPaths(root: string): ProjectPaths {
  const resolvedRoot = path.resolve(root);
  return {
    root: resolvedRoot,
    project: safeProjectPath(resolvedRoot, PROJECT_DIR),
    config: safeProjectPath(resolvedRoot, PROJECT_CONFIG_PATH),
    manifest: safeProjectPath(resolvedRoot, INSTALL_MANIFEST_PATH),
    workflow: safeProjectPath(resolvedRoot, WORKFLOW_PATH),
    spec: safeProjectPath(resolvedRoot, `${PROJECT_DIR}/spec`),
    tasks: safeProjectPath(resolvedRoot, `${PROJECT_DIR}/tasks`),
    workspace: safeProjectPath(resolvedRoot, `${PROJECT_DIR}/workspace`),
    runtime: safeProjectPath(resolvedRoot, `${PROJECT_DIR}/.runtime`)
  };
}

/** Convert a display name into a stable, project-safe workspace directory name. */
export function developerSlug(developer: string): string {
  const slug = developer
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "developer";
}

export function createProjectConfig(developer: string, platforms: PlatformId[] = ["codex"]): ProjectConfig {
  const normalizedDeveloper = developer.trim();
  if (!normalizedDeveloper) {
    throw new OpenNoriError("developer_required", "A non-empty developer name is required to initialize OpenNori.");
  }
  const config: ProjectConfig = {
    schema_version: "opennori/project-v1",
    developer: normalizedDeveloper,
    platforms
  };
  assertSchema<ProjectConfig>("project", config);
  return config;
}

export function renderProjectConfig(config: ProjectConfig): string {
  assertSchema<ProjectConfig>("project", config);
  validateProjectConfig(config);
  return YAML.stringify(config, { lineWidth: 0 });
}

function validateProjectConfig(config: ProjectConfig): void {
  const packages = config.packages ?? {};
  if (config.default_package && !packages[config.default_package]) {
    throw new OpenNoriError("config_default_package_unknown", `Default package ${config.default_package} is not registered in packages.`, {
      recovery: "Register that package with a project-relative path, choose another default_package, or remove the default."
    });
  }
  const paths = new Map<string, string>();
  for (const [packageId, definition] of Object.entries(packages)) {
    const normalized = path.posix.normalize(definition.path.replaceAll("\\", "/"));
    const normalizedPath = normalized === "." ? normalized : normalized.replace(/\/+$/, "");
    if (normalizedPath !== definition.path || normalizedPath.startsWith("../") || path.posix.isAbsolute(normalizedPath)) {
      throw new OpenNoriError("config_package_path_invalid", `Package ${packageId} has a non-canonical path: ${definition.path}.`, {
        recovery: "Use one canonical project-relative directory path for each package."
      });
    }
    const existing = paths.get(normalizedPath);
    if (existing) {
      throw new OpenNoriError("config_package_path_duplicate", `Packages ${existing} and ${packageId} both use ${definition.path}.`, {
        recovery: "Give each package a distinct project-relative directory."
      });
    }
    paths.set(normalizedPath, packageId);
  }
}

/** Resolve and verify one registered package directory without blocking unrelated recovery. */
export function projectPackageDirectory(root: string, config: ProjectConfig, packageId: string): string {
  validateProjectConfig(config);
  const definition = config.packages?.[packageId];
  if (!definition) {
    throw new OpenNoriError("task_package_unknown", `Package ${packageId} is not registered in .opennori/config.yaml.`, {
      recovery: "Register the package path first, or create the task without --package."
    });
  }
  const directory = safeProjectPath(root, definition.path);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new OpenNoriError("config_package_path_missing", `Package ${packageId} directory is missing: ${definition.path}.`, {
      recovery: "Create the directory or update the package path in .opennori/config.yaml."
    });
  }
  return directory;
}

/** Reject registered package aliases that resolve to the same real directory. */
export function assertDistinctProjectPackageDirectories(root: string, config: ProjectConfig): void {
  validateProjectConfig(config);
  const identities = new Map<string, string>();
  for (const [packageId, definition] of Object.entries(config.packages ?? {})) {
    const directory = safeProjectPath(root, definition.path);
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) continue;
    const stat = fs.statSync(directory);
    const identity = `${stat.dev}:${stat.ino}`;
    const existing = identities.get(identity);
    if (existing) {
      throw new OpenNoriError(
        "config_package_directory_duplicate",
        `Packages ${existing} and ${packageId} resolve to the same directory: ${definition.path}.`,
        { recovery: "Give each package a distinct project-relative directory." }
      );
    }
    identities.set(identity, packageId);
  }
}

/** Resolve an explicit or default task package against the project registry. */
export function resolveProjectPackage(root: string, config: ProjectConfig, requested?: string): string | null {
  const packageId = requested?.trim() || config.default_package || null;
  if (!packageId) return null;
  assertDistinctProjectPackageDirectories(root, config);
  projectPackageDirectory(root, config, packageId);
  return packageId;
}

/** Read and validate the user-editable project configuration. */
export function readProjectConfig(root: string): ProjectConfig {
  const configPath = projectPaths(root).config;
  if (!fs.existsSync(configPath)) {
    throw new OpenNoriError("project_not_initialized", `OpenNori project config is missing: ${PROJECT_CONFIG_PATH}`, {
      recovery: "Run opennori init --user <name>."
    });
  }
  let payload: unknown;
  try {
    payload = YAML.parse(readText(configPath)) as unknown;
  } catch (error) {
    throw new OpenNoriError(
      "config_invalid",
      `Cannot parse ${PROJECT_CONFIG_PATH}: ${error instanceof Error ? error.message : String(error)}`,
      { context: { path: configPath }, recovery: "Repair the YAML, then run opennori doctor again." }
    );
  }
  assertSchema<ProjectConfig>("project", payload);
  validateProjectConfig(payload);
  return payload;
}

/** Read and validate the install-only ownership manifest. */
export function readInstallManifest(root: string): InstallManifest {
  const manifestPath = projectPaths(root).manifest;
  if (!fs.existsSync(manifestPath)) {
    throw new OpenNoriError("manifest_missing", `OpenNori install manifest is missing: ${INSTALL_MANIFEST_PATH}`, {
      recovery: "Restore the manifest from version control or preview 'opennori update --repair-manifest --dry-run'."
    });
  }
  const payload = readJson<unknown>(manifestPath);
  assertSchema<InstallManifest>("manifest", payload);
  return payload;
}

export function requireCurrentStateSchema(root: string): InstallManifest {
  const manifest = readInstallManifest(root);
  if (manifest.state_schema_version !== CURRENT_STATE_SCHEMA_VERSION) {
    const newer = manifest.state_schema_version > CURRENT_STATE_SCHEMA_VERSION;
    throw new OpenNoriError(
      newer ? "state_schema_newer" : "state_migration_required",
      newer
        ? `Project state schema ${manifest.state_schema_version} is newer than this OpenNori CLI supports (${CURRENT_STATE_SCHEMA_VERSION}).`
        : `Project state schema ${manifest.state_schema_version} must be migrated to ${CURRENT_STATE_SCHEMA_VERSION} before task work continues.`,
      {
        recovery: newer
          ? "Run npx opennori setup with the project-compatible OpenNori version, then rerun Doctor."
          : "Run opennori update --dry-run, review the migration, then rerun with --confirm."
      }
    );
  }
  return manifest;
}

export function currentProductVersion(): string {
  const payload = readJson<{ version?: unknown }>(packagePath("package.json"));
  if (typeof payload.version !== "string" || !payload.version.trim()) {
    throw new OpenNoriError("package_invalid", "OpenNori package.json does not declare a version.");
  }
  return payload.version;
}

function manifestSchemaVersion(filePath: string): string | null {
  try {
    const payload = JSON.parse(readText(filePath)) as { schema_version?: unknown };
    return typeof payload.schema_version === "string" ? payload.schema_version : null;
  } catch {
    return null;
  }
}

/**
 * Classify project state without treating unreadable current state as legacy.
 * Only the previous manifest schema is a strong enough marker for destructive
 * legacy replacement; every ambiguous existing tree fails closed.
 */
export function inspectProjectInstallation(root: string): ProjectInstallationInspection {
  const paths = projectPaths(root);
  if (!fs.existsSync(paths.project)) {
    return { state: "absent", reason: `${PROJECT_DIR}/ does not exist.` };
  }
  if (!fs.statSync(paths.project).isDirectory()) {
    return { state: "damaged_foundation", reason: `${PROJECT_DIR} exists but is not a directory.` };
  }

  const configExists = fs.existsSync(paths.config);
  const manifestExists = fs.existsSync(paths.manifest);
  const schemaVersion = manifestExists ? manifestSchemaVersion(paths.manifest) : null;
  if (!configExists && schemaVersion === "opennori/manifest-v1") {
    return { state: "legacy", reason: "The previous OpenNori manifest schema identifies legacy project state." };
  }

  if (!configExists || !manifestExists) {
    const missing = [!configExists ? PROJECT_CONFIG_PATH : null, !manifestExists ? INSTALL_MANIFEST_PATH : null].filter(Boolean).join(" and ");
    return { state: "damaged_foundation", reason: `Existing ${PROJECT_DIR} state is missing ${missing}.` };
  }

  try {
    readProjectConfig(root);
    readInstallManifest(root);
    return { state: "foundation", reason: "Project config and install manifest are schema-valid." };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { state: "damaged_foundation", reason: `Existing foundation state is unreadable or invalid: ${message}` };
  }
}

function template(relativePath: string, replacements: Record<string, string> = {}): string {
  let content = readText(packagePath("templates", relativePath));
  for (const [name, value] of Object.entries(replacements)) {
    content = content.replaceAll(`{{${name}}}`, value);
  }
  return content;
}

/**
 * Declare the complete generated surface. The lifecycle engine is
 * the only code allowed to turn these declarations into filesystem writes.
 */
export function projectAssets(config: ProjectConfig): ManagedAsset[] {
  assertSchema<ProjectConfig>("project", config);

  const slug = developerSlug(config.developer);
  const replacements = {
    DEVELOPER: config.developer,
    DEVELOPER_SLUG: slug
  };
  return [
    {
      assetId: "core.project-config",
      platform: "core",
      path: PROJECT_CONFIG_PATH,
      scope: "file",
      policy: "seed",
      content: renderProjectConfig(config)
    },
    {
      assetId: "core.workflow",
      platform: "core",
      path: WORKFLOW_PATH,
      scope: "file",
      policy: "managed",
      content: template("workflow.md")
    },
    {
      assetId: "core.spec-index",
      platform: "core",
      path: `${PROJECT_DIR}/spec/index.md`,
      scope: "file",
      policy: "seed",
      content: template("spec/index.md")
    },
    {
      assetId: "core.project-spec",
      platform: "core",
      path: `${PROJECT_DIR}/spec/project.md`,
      scope: "file",
      policy: "seed",
      content: template("spec/project.md")
    },
    {
      assetId: "core.task-archive-root",
      platform: "core",
      path: `${PROJECT_DIR}/tasks/archive/.gitkeep`,
      scope: "file",
      policy: "managed",
      content: ""
    },
    {
      assetId: "core.workspace-index",
      platform: "core",
      path: `${PROJECT_DIR}/workspace/index.md`,
      scope: "file",
      policy: "seed",
      content: template("workspace/index.md", replacements)
    },
    {
      assetId: "core.developer-index",
      platform: "core",
      path: `${PROJECT_DIR}/workspace/${slug}/index.md`,
      scope: "file",
      policy: "seed",
      content: template("workspace/developer-index.md", replacements)
    },
    {
      assetId: "core.developer-journal",
      platform: "core",
      path: `${PROJECT_DIR}/workspace/${slug}/journal.md`,
      scope: "file",
      policy: "seed",
      content: template("workspace/journal.md", replacements)
    },
    {
      assetId: "core.runtime-root",
      platform: "core",
      path: `${PROJECT_DIR}/.runtime/sessions/.gitkeep`,
      scope: "file",
      policy: "managed",
      content: ""
    },
    ...projectPlatformAssets(config),
    {
      assetId: "core.runtime-ignore",
      platform: "core",
      path: GITIGNORE_PATH,
      scope: "section",
      policy: "managed",
      content: template("gitignore-section.txt"),
      markers: GITIGNORE_SECTION_MARKERS
    }
  ];
}

export function isFoundationProject(root: string): boolean {
  return inspectProjectInstallation(root).state === "foundation";
}
