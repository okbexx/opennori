import type { ExternalCommandResult, ExternalCommandRunner } from "../external-actions.ts";

export type GlobalNpmPackageProbe = {
  available: boolean;
  installed_version: string | null;
  result: ExternalCommandResult;
};

export function parseGlobalNpmPackageVersion(stdout: string, packageName: string): string | null {
  try {
    const payload = JSON.parse(stdout) as { dependencies?: Record<string, { version?: string }> };
    return payload.dependencies?.[packageName]?.version || null;
  } catch {
    return null;
  }
}

export function inspectGlobalNpmPackage(runner: ExternalCommandRunner, packageName: string): GlobalNpmPackageProbe {
  const result = runner("npm", ["ls", "-g", packageName, "--depth=0", "--json"]);
  return {
    available: result.error === undefined && result.status !== null,
    installed_version: parseGlobalNpmPackageVersion(result.stdout, packageName),
    result
  };
}
