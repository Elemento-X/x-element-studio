import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import localFont from 'next/font/local'
import { Exo_2, JetBrains_Mono } from 'next/font/google'
import { routing, type Locale } from '@/i18n/config'
import '../globals.css'

const inter = localFont({
  src: [
    {
      path: '../../public/fonts/Inter_18pt-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter_18pt-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter_18pt-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter_18pt-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
})

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-exo',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

// Metadata varies per locale (title, description, OG, Twitter all
// localized). `generateMetadata` runs per locale segment and reads
// from `messages.<locale>.json::metadata`.
//
// `metadataBase` lives at module scope (not inside generateMetadata)
// so Next can resolve relative URLs in OG/Twitter image routes at
// prerender time — otherwise the build warns and falls back to
// localhost.
//
// `keywords` meta tag was removed (Google has ignored it since 2009;
// Bing too). The terms that matter for ranking (Full Stack, AI
// Engineering, etc.) live in title/description/H1/H3 where they
// actually count — not in a cosmetic head tag.
export const metadataBase = new URL('https://elemento-x.com')

// Path each locale serves on. Default (en) lives at the root because
// `localePrefix: 'as-needed'` — the others carry their prefix.
function pathFor(locale: string): string {
  if (locale === routing.defaultLocale) return '/'
  return `/${locale}`
}

// hreflang values follow IETF BCP 47. Our routing locales are already
// in that form (en, pt-br, es, fr). `x-default` is the SEO sentinel
// for "user without a clear language preference" → points at the
// default locale's URL.
function buildLanguageAlternates(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const l of routing.locales) {
    map[l] = pathFor(l)
  }
  map['x-default'] = pathFor(routing.defaultLocale)
  return map
}

// OG locale needs the `xx_YY` form. Our routing locales are simpler
// (en, pt-br, es, fr); map to the OG canonical here.
const OG_LOCALE: Record<string, string> = {
  en: 'en_US',
  'pt-br': 'pt_BR',
  es: 'es_ES',
  fr: 'fr_FR',
}

function ogLocaleFor(locale: string): string {
  return OG_LOCALE[locale] ?? 'en_US'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const canonicalPath = pathFor(locale)
  const alternateLocales = routing.locales
    .filter((l) => l !== locale)
    .map(ogLocaleFor)

  return {
    title: {
      default: t('title'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    authors: [{ name: 'Elemento-X Studio' }],
    alternates: {
      canonical: canonicalPath,
      languages: buildLanguageAlternates(),
    },
    openGraph: {
      type: 'website',
      locale: ogLocaleFor(locale),
      alternateLocale: alternateLocales,
      url: `https://elemento-x.com${canonicalPath === '/' ? '' : canonicalPath}`,
      siteName: 'Elemento-X',
      title: t('ogTitle'),
      description: t('ogDescription'),
      // app/opengraph-image.tsx lives at the root (single canonical
      // share-card URL across all locales) — reference it explicitly
      // here because Next's auto-wiring only kicks in when the image
      // route sits in the same segment as the layout's metadata.
      // The `alt` text is localized through messages.
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
      images: [{ url: '/twitter-image', alt: t('ogImageAlt') }],
    },
    robots: { index: true, follow: true },
  }
}

// Generate the three static locale params at build time. Without this,
// every locale segment becomes dynamic — which inflates the function
// count and defeats next-intl's per-locale message-bundle splitting.
export function generateStaticParams(): { locale: Locale }[] {
  return routing.locales.map((locale) => ({ locale }))
}

// JSON-LD Organization + WebSite. Enables Google's knowledge panel
// (logo, sameAs links) and the cleaner site-name rendering in SERP.
// Stable schema reference: https://schema.org/Organization +
// https://schema.org/WebSite. Validated against Google's structured
// data guidelines:
//   https://developers.google.com/search/docs/appearance/structured-data/logo
//   https://developers.google.com/search/docs/appearance/site-names
//
// `inLanguage` on WebSite uses the BCP-47 canonical form — language
// subtag lowercase, region subtag UPPERCASE (so `pt-BR`, not `pt-br`).
// Our routing tag is lowercase throughout (URL prefix, `<html lang>`),
// which is also valid BCP-47 (the spec says comparisons are
// case-insensitive). The structured-data validator is the only place
// that flags the discrepancy, hence the mapping below — for
// `<html lang>` and hreflang we keep the lowercase form.
//
// Server-rendered with `JSON.stringify` then `< → \\u003c` so any
// `</script>` substring that might appear inside a string field can't
// terminate the embedding `<script>` block. The payload is fully code-
// controlled (no user input) and the ESLint `react/no-danger` rule is
// the right thing to gate against — except for this exact JSON-LD
// pattern that Google's docs prescribe.
// BCP-47 canonical-form map for structured data. Mirrors the OG locale
// map but with a hyphen (BCP-47) instead of an underscore (OG).
const BCP47: Record<string, string> = {
  en: 'en',
  'pt-br': 'pt-BR',
  es: 'es',
  fr: 'fr',
}

function buildStructuredData(locale: string): string {
  const inLanguage = BCP47[locale] ?? 'en'
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://elemento-x.com/#organization',
        name: 'Elemento-X',
        url: 'https://elemento-x.com',
        logo: 'https://elemento-x.com/apple-icon',
        // sameAs left empty for now — to be populated once the studio
        // ships official LinkedIn / GitHub / X handles. Adding them
        // later is a one-line edit; ranking only kicks in when the
        // accounts exist, so leaving the array empty avoids false
        // signals.
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://elemento-x.com/#website',
        url: 'https://elemento-x.com',
        name: 'Elemento-X',
        publisher: { '@id': 'https://elemento-x.com/#organization' },
        inLanguage,
      },
    ],
  }
  return JSON.stringify(ld).replace(/</g, '\\u003c')
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Static rendering opt-in for this locale segment.
  setRequestLocale(locale)

  const fontVars = `${inter.variable} ${exo2.variable} ${jetbrainsMono.variable}`
  const ldJson = buildStructuredData(locale)
  return (
    <html lang={locale} className={fontVars}>
      <body data-atmosphere="signal" data-density="standard" data-accent="gold">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        {/* JSON-LD structured data. Payload is code-controlled (no user
            input). `<` escaped to `<` blocks any future `</script>`
            injection. Google's recommended pattern:
            https://developers.google.com/search/docs/appearance/structured-data */}
        {/* eslint-disable react/no-danger */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ldJson }}
        />
        {/* eslint-enable react/no-danger */}
      </body>
    </html>
  )
}
