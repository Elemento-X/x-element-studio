import type { MetadataRoute } from 'next'

/**
 * robots.txt generator (F4.4 SEO i18n).
 *
 * Permissive default — crawl everything except the API routes (no
 * indexable content there, and `/api/csp-report` is a violation sink
 * the crawler should never hit). Sitemap reference points at the
 * Next-generated sitemap.xml.
 */

const BASE_URL = 'https://elemento-x.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Disallow listed twice on purpose:
        //   - `/api/` covers everything under the API namespace
        //     (well-behaved crawlers will obey).
        //   - `/api`  covers the exact path with no trailing slash
        //     — defense-in-depth against the rare edge where a crawler
        //     parses `/api/...` differently from the bare `/api`.
        // (@security BAIXO finding from F4.7 audit.)
        disallow: ['/api/', '/api'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    // `host:` directive intentionally omitted. It was a Yandex-only
    // signal (deprecated upstream in 2018) and is ignored by Google,
    // Bing, and DuckDuckGo. The canonical host is already declared via
    // `<link rel="canonical">` in the layout — no need to repeat it
    // here as a non-standard directive.
  }
}
