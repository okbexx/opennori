export type PluginSkillState = {
  name: string;
  description: string;
  path: string;
  source: "package";
};

export type PluginState = {
  schema_version: "opennori/plugin-v1";
  name: string;
  version: string;
  manifest_path: string;
  marketplace_path: string;
  marketplace_name: string;
  marketplace_plugin_path: string;
  skills_path: string;
  packaged: boolean;
  marketplace_packaged: boolean;
  skill_count: number;
  skills: PluginSkillState[];
};
