/**
 * BCP-47 canonical-form map for structured data (JSON-LD).
 *
 * BCP 47 says language subtag lowercase, region subtag UPPERCASE
 * (so `pt-BR`, not `pt-br`). The structured-data validator is the
 * only consumer that flags the casing discrepancy — for `<html lang>`
 * and hreflang we keep the lowercase form everywhere else.
 *
 * Lives here (not co-located with the layout) so it has a unit test
 * surface independent of Next's app router runtime. The fallback
 * branch (`unknown locale → 'en'`) is structurally unreachable in
 * production because `generateStaticParams` constrains locales to
 * the routing enum — but we test the fallback explicitly so a future
 * regression in `generateStaticParams` doesn't propagate silently
 * into the JSON-LD payload Google indexes.
 */

const BCP47_BY_LOCALE: Readonly<Record<string, string>> = {
  en: 'en',
  'pt-br': 'pt-BR',
  es: 'es',
  fr: 'fr',
}

export function toBCP47(locale: string): string {
  return BCP47_BY_LOCALE[locale] ?? 'en'
}
