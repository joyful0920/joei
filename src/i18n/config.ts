export const locales = ["ja", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

export const LANGUAGE_MAP = {
  ja: "ja-JP",
  ko: "ko-KR",
} as const satisfies Record<Locale, string>;

export type TmdbLanguage = (typeof LANGUAGE_MAP)[Locale];
