import { LANGUAGE_MAP, type Locale } from "@/i18n/config";

export function toTmdbLanguage(locale: string): string {
  if (locale in LANGUAGE_MAP) {
    return LANGUAGE_MAP[locale as Locale];
  }
  return LANGUAGE_MAP.ja;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ja" || value === "ko";
}
