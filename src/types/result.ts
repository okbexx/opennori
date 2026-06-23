import type { JsonObject } from "./common.ts";

export type NoriArtifact = {
  kind: string;
  path?: string;
  [key: string]: unknown;
};

export type NoriWarning = {
  type?: string;
  message?: string;
  [key: string]: unknown;
};

export type NoriOk<T extends object = JsonObject> = {
  ok: true;
  data: T;
  artifacts: NoriArtifact[];
  warnings: NoriWarning[];
  next_actions: string[];
};

export type NoriFailure = {
  ok: false;
  error: {
    type: string;
    message: string;
    fix?: string;
  };
};

export type NoriResult<T extends object = JsonObject> = NoriOk<T> | NoriFailure;
