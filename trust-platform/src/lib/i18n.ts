export const locales = ["en", "ja"] as const;

export type Locale = (typeof locales)[number];

export type LocaleSearchParams = {
  lang?: string | string[];
};

export function resolveLocale(searchParams?: LocaleSearchParams): Locale {
  const value = Array.isArray(searchParams?.lang)
    ? searchParams.lang[0]
    : searchParams?.lang;

  return value === "ja" ? "ja" : "en";
}

export function localizedHref(path: string, locale: Locale): string {
  if (locale === "en") {
    return path;
  }

  const [base, hash] = path.split("#");
  const separator = base.includes("?") ? "&" : "?";
  const href = `${base}${separator}lang=ja`;

  return hash ? `${href}#${hash}` : href;
}

export function nextLocale(locale: Locale): Locale {
  return locale === "ja" ? "en" : "ja";
}
