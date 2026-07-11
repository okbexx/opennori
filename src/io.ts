import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { OpenNoriError } from "./errors.ts";

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeText(content: string): string {
  return content.replace(/\r\n/g, "\n");
}

export function contentHash(content: string): string {
  return `sha256:${crypto.createHash("sha256").update(normalizeText(content)).digest("hex")}`;
}

/** Reject lexical escapes and existing symlink segments before project writes. */
export function safeProjectPath(root: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new OpenNoriError("unsafe_path", `Expected a project-relative path: ${relativePath}`);
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new OpenNoriError("unsafe_path", `Path escapes the project root: ${relativePath}`);
  }

  let current = resolvedRoot;
  for (const segment of path.relative(resolvedRoot, resolved).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new OpenNoriError("unsafe_path", `Refusing to traverse a symbolic link: ${path.relative(resolvedRoot, current)}`);
    }
  }
  return resolved;
}

export function readText(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

export function readJson<T>(filePath: string): T {
  try {
    return JSON.parse(readText(filePath)) as T;
  } catch (error) {
    throw new OpenNoriError("invalid_json", `Cannot read JSON state at ${filePath}: ${error instanceof Error ? error.message : String(error)}`, {
      context: { path: filePath }
    });
  }
}

export function writeTextAtomic(filePath: string, content: string): void {
  writeBufferAtomic(filePath, Buffer.from(normalizeText(content), "utf8"));
}

export function writeBufferAtomic(filePath: string, content: Uint8Array, mode?: number): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp-${process.pid}-${crypto.randomUUID()}`;
  const targetMode = mode ?? (fs.existsSync(filePath) ? fs.statSync(filePath).mode : undefined);
  try {
    fs.writeFileSync(temporary, content);
    if (targetMode !== undefined) fs.chmodSync(temporary, targetMode & 0o7777);
    fs.renameSync(temporary, filePath);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

export function writeJsonAtomic(filePath: string, payload: unknown): void {
  writeTextAtomic(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function appendJsonLine(filePath: string, payload: unknown): void {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath) : Buffer.alloc(0);
  const separator = existing.length > 0 && existing[existing.length - 1] !== 0x0a ? Buffer.from("\n") : Buffer.alloc(0);
  const record = Buffer.from(`${JSON.stringify(payload)}\n`, "utf8");
  writeBufferAtomic(filePath, Buffer.concat([existing, separator, record]));
}

export function readJsonLines<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  return readText(filePath)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line) as T;
      } catch (error) {
        throw new OpenNoriError("invalid_jsonl", `Invalid JSONL at ${filePath}:${index + 1}: ${error instanceof Error ? error.message : String(error)}`, {
          context: { path: filePath, line: index + 1 }
        });
      }
    });
}

export function posixRelative(root: string, filePath: string): string {
  return path.relative(path.resolve(root), path.resolve(filePath)).split(path.sep).join("/");
}
