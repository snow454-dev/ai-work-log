import "server-only";

import { cookies } from "next/headers";

import {
  localeCookieName,
  localeFromValue,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

export async function resolveServerLocale(
  searchParams?: LocaleSearchParams,
): Promise<Locale> {
  const cookieLocale = localeFromValue(
    (await cookies()).get(localeCookieName)?.value,
  );

  return resolveLocale(searchParams, cookieLocale ?? "en");
}
