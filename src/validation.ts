import fs from "node:fs";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { OpenNoriError } from "./errors.ts";
import { packagePath } from "./package-root.ts";

const SCHEMAS = {
  project: "project.schema.json",
  manifest: "manifest.schema.json",
  task: "task.schema.json",
  legacyTask: "task-v1.schema.json",
  delivery: "delivery.schema.json",
  contract: "contract.schema.json",
  contractInput: "contract-input.schema.json",
  evidence: "evidence.schema.json",
  evidenceInput: "evidence-input.schema.json",
  context: "context.schema.json",
  session: "session.schema.json"
} as const;

export type SchemaName = keyof typeof SCHEMAS;

const Ajv2020 = Ajv2020Module as unknown as new (options: { allErrors: boolean; strict: boolean }) => {
  compile(schema: unknown): ((payload: unknown) => boolean) & { errors?: Array<{ instancePath?: string; message?: string }> };
};
const addFormats = addFormatsModule as unknown as (instance: unknown) => void;
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validators = new Map<SchemaName, ReturnType<typeof ajv.compile>>();

export function assertSchema<T>(name: SchemaName, payload: unknown): asserts payload is T {
  let validate = validators.get(name);
  if (!validate) {
    const schema = JSON.parse(fs.readFileSync(packagePath("schemas", SCHEMAS[name]), "utf8")) as unknown;
    validate = ajv.compile(schema);
    validators.set(name, validate);
  }
  if (validate(payload)) return;
  const details = (validate.errors ?? [])
    .slice(0, 4)
    .map((error) => `${error.instancePath || "/"} ${error.message || "is invalid"}`)
    .join("; ");
  throw new OpenNoriError("schema_invalid", `${name} state is invalid: ${details}`, { context: { schema: name } });
}
