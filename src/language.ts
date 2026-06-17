import type { ContractLanguage, NoriBrief, NoriContract } from "./types.ts";

export const DEFAULT_CONTRACT_LANGUAGE: ContractLanguage = "en";
export type PresentationLanguage = ContractLanguage;

const SUPPORTED_CONTRACT_LANGUAGES = new Set(["zh-CN", "en"]);

export function normalizeContractLanguage(language: unknown, fallback: ContractLanguage = DEFAULT_CONTRACT_LANGUAGE): ContractLanguage {
  const value = String(language || "").trim().toLowerCase();
  if (!value) return fallback;
  if (["zh", "zh-cn", "zh_cn", "cn", "chinese", "中文", "简体中文"].includes(value)) return "zh-CN";
  if (["en", "en-us", "en_us", "english", "英文"].includes(value)) return "en";
  return SUPPORTED_CONTRACT_LANGUAGES.has(value) ? value as ContractLanguage : fallback;
}

export function inferContractLanguage(text: unknown, fallback: ContractLanguage = DEFAULT_CONTRACT_LANGUAGE): ContractLanguage {
  const value = String(text || "");
  if (!value.trim()) return fallback;
  const cjkCount = [...value].filter((char) => /[\u3400-\u9fff]/u.test(char)).length;
  return cjkCount >= 2 ? "zh-CN" : fallback;
}

export function contractLanguageFromBrief(brief: NoriBrief): ContractLanguage {
  return normalizeContractLanguage(brief.presentation?.language, inferContractLanguage(brief.goal));
}

export function contractLanguage(contract: NoriContract): ContractLanguage {
  return normalizeContractLanguage(contract.presentation?.language);
}

export function withContractLanguage<T extends { presentation?: Record<string, unknown> }>(value: T, language: ContractLanguage): T {
  return {
    ...value,
    presentation: {
      ...(value.presentation || {}),
      language: normalizeContractLanguage(language)
    }
  };
}
