export type JsonObject = Record<string, any>;

export type NoriArtifact = {
  kind: string;
  path?: string;
  [key: string]: any;
};

export type NoriWarning = {
  type?: string;
  message?: string;
  [key: string]: any;
};

export type NoriOk<T extends JsonObject = JsonObject> = {
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

export type NoriResult<T extends JsonObject = JsonObject> = NoriOk<T> | NoriFailure;

export type PathPair = {
  jsonPath: string;
  markdownPath: string;
};

export type ManagedAction = {
  path: string;
  action: string;
  kind: string;
  managed: boolean;
  reason?: string;
  recursive?: boolean;
  manifest?: JsonObject;
  write?: () => unknown;
  from_version?: string;
  to_version?: string;
  [key: string]: any;
};

export type ValidationIssue = {
  path: string;
  message: string;
  [key: string]: any;
};
