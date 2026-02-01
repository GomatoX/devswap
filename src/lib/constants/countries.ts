import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register English locale
countries.registerLocale(enLocale);

// Get all countries as array
export function getAllCountries(): { code: string; name: string }[] {
  const countryNames = countries.getNames("en", { select: "official" });
  return Object.entries(countryNames)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Priority countries for IT outsourcing (shown first in dropdowns)
export const PRIORITY_COUNTRIES = [
  "LT", // Lithuania
  "LV", // Latvia
  "EE", // Estonia
  "PL", // Poland
  "DE", // Germany
  "NL", // Netherlands
  "GB", // United Kingdom
  "US", // United States
  "UA", // Ukraine
];

export function getCountryName(code: string): string {
  return countries.getName(code, "en") ?? code;
}

export function isValidCountryCode(code: string): boolean {
  return countries.isValid(code);
}
