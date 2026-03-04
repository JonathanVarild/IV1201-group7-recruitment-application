import * as dateFnsLocales from "date-fns/locale";
import type { Locale } from "date-fns";

/**
 * All `date-fns` locales keyed by locale identifier (e.g. `enUS`, `sv`).
 *
 * Useful for dynamic locale lookups without manually importing each locale.
 */
export const locales = dateFnsLocales as Record<string, Locale>;

/**
 * Resolves a `date-fns` locale from an i18n locale string.
 *
 * Resolution order:
 * 1. Exact match (e.g. `"sv"`).
 * 2. Language part of a BCP-47 tag (e.g. `"sv-SE"` -> `"sv"`).
 * 3. Fallback to English (`enUS`).
 *
 * @param locale - Active i18n locale, optionally including region (e.g. `"en"`, `"sv-SE"`).
 * @returns A `date-fns` {@link Locale} object for date formatting and calendar UI.
 */
export function getDateFnsLocale(locale: string): Locale {
  if (locales[locale]) return locales[locale];

  const base = locale.split("-")[0];
  if (locales[base]) return locales[base];

  //Fallback
  return locales.enUS;
}
