import { defineRouting } from 'next-intl/routing'

/**
 * Routing config for next-intl (F4).
 *
 * Locales:
 *   - en      (default + source of truth — F3 copy was authored in EN)
 *   - pt-br   (translation — Brazilian Portuguese)
 *   - es      (translation — Spanish, peninsular Spain target)
 *   - fr      (translation — French, France target)
 *
 * Locale code style: lowercase + hyphen for regional variants
 * (`pt-br`). Bare codes (`en`, `es`, `fr`) where no regional split
 * is intended. SEO `hreflang` tags inherit from these.
 *
 * `localePrefix: 'as-needed'`: the default locale (en) serves the
 * domain root unprefixed (`xelement.studio/`) — better for the
 * international landing's organic SEO. Other locales carry their
 * prefix (`/pt-br`, `/es`, `/fr`). Switching default in the future
 * would be a URL-breaking change; documented here.
 */
export const routing = defineRouting({
  locales: ['en', 'pt-br', 'es', 'fr'] as const,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
