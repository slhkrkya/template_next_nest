import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

/**
 * Supported locales. The first entry is the default.
 */
export const SUPPORTED_LOCALES = ['en', 'tr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Resolve the locale for the current server request.
 *
 * Priority order:
 *   1. `NEXT_LOCALE` cookie (set by the LanguageSwitcher)
 *   2. `Accept-Language` header (best-effort — not available in all runtimes)
 *   3. Default locale (en)
 */
function resolveLocale(cookieLocale: string | undefined): SupportedLocale {
  if (
    cookieLocale &&
    SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)
  ) {
    return cookieLocale as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = resolveLocale(cookieLocale);

  return {
    locale,
    messages: (await import(`./${locale}.json`)).default,
  };
});
