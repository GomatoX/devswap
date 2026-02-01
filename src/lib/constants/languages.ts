// Common languages for IT professionals
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "et", name: "Estonian" },
  { code: "pl", name: "Polish" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "cs", name: "Czech" },
  { code: "sk", name: "Slovak" },
  { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sl", name: "Slovenian" },
  { code: "fi", name: "Finnish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
] as const;

// Priority languages shown first in dropdowns
export const PRIORITY_LANGUAGES = [
  "en", // English
  "lt", // Lithuanian
  "de", // German
  "pl", // Polish
  "ru", // Russian
  "uk", // Ukrainian
];

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function getLanguageName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

export function getLanguageNames(codes: string[]): string[] {
  return codes.map(getLanguageName);
}

export function getAllLanguages(): { code: string; name: string }[] {
  return [...LANGUAGES];
}
