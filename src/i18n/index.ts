import { en } from "./en";
import { es } from "./es";

export type Language = "en" | "es";

export const translations = {
  en,
  es,
};

export type TranslationKey = keyof typeof en;

// Helper function to format strings with variables
export function formatString(
  str: string,
  params: Record<string, string | number>,
): string {
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{${key}}`, "g"), String(value));
  }, str);
}

// Get all available languages
export const availableLanguages = Object.keys(translations) as Language[];

// Get language name in its native form
export function getLanguageName(lang: Language): string {
  switch (lang) {
    case "en":
      return "English";
    case "es":
      return "Español";
    default:
      return lang;
  }
}
