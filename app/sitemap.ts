import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/config'

/**
 * Sitemap generator (F4.4 SEO i18n).
 *
 * Currently the landing has a single route (the locale-root page),
 * served at `/` for the default locale and `/<locale>` for the others.
 * Each entry advertises its full `alternates.languages` map so crawlers
 * pick up the locale variants from any single URL.
 *
 * Frequency / priority: this is a marketing landing, edited rarely;
 * `weekly` change frequency + 1.0 priority for the home is fine. When
 * future routes are added (blog, case-study deep links, etc.), extend
 * the `ROUTES` array — the per-locale + alternates expansion is
 * already in place.
 */

const BASE_URL = 'https://xelement.studio'

// Last-modified marker for the sitemap. Hardcoded to the release date
// of the content shape — NOT `new Date()` at request time, which would
// be a freshness lie that Google explicitly warns about (Gary Illyes:
// "if you lie about lastmod, we'll learn to ignore it"). Update this
// constant manually when copy/structure changes that crawlers should
// re-index. Once we have CMS-managed content, derive per-entry.
const LAST_MODIFIED = new Date('2026-05-10')

// Path segments to expose, relative to the locale root. Empty string =
// the locale's home page. Adding a path here automatically generates
// one entry per locale, plus the alternates.languages map for each.
const ROUTES: {
  path: string
  changeFrequency: ChangeFreq
  priority: number
}[] = [{ path: '', changeFrequency: 'weekly', priority: 1.0 }]

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

function urlFor(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale
  const localePart = isDefault ? '' : `/${locale}`
  const pathPart = path ? `/${path}` : ''
  return `${BASE_URL}${localePart}${pathPart}`
}

function alternatesFor(path: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const l of routing.locales) {
    map[l] = urlFor(l, path)
  }
  // x-default points at the default-locale URL (root in `as-needed`
  // mode); Google uses it as the fallback for users without a clear
  // language match.
  map['x-default'] = urlFor(routing.defaultLocale, path)
  return map
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const route of ROUTES) {
    const languages = alternatesFor(route.path)
    for (const l of routing.locales) {
      entries.push({
        url: urlFor(l, route.path),
        lastModified: LAST_MODIFIED,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      })
    }
  }

  return entries
}
