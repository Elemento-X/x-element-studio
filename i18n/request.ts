import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './config'

/**
 * Server-side message loader for the active locale.
 *
 * Hot path: runs on every server-rendered request when the locale
 * segment is dynamic. Keep the import path static so Next can split
 * the messages bundle per locale at build time.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
