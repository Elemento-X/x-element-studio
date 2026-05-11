import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Open Graph image (1200×630).
 *
 * Lives at the app root (not inside `[locale]/`) so it serves under
 * a single canonical URL across every locale. With `localePrefix:
 * 'as-needed'` next-intl would redirect `/<locale>/opengraph-image`
 * to `/opengraph-image` anyway, so we go straight to the canonical
 * path and reference it explicitly from `generateMetadata` instead
 * of relying on Next's per-segment auto-wiring.
 *
 * The visual is locale-agnostic today (wordmark + tagline kept in
 * English as brand vocabulary, same rationale as service titles).
 *
 * Visual: dark background, gold flask emblem on the left, wordmark +
 * tagline on the right. Matches the brand rule "1 gold per primary
 * viewport" — the flask is the single gold element.
 *
 * Satori (the renderer behind next/og) requires explicit `display`
 * on every container that holds more than one child, and supports
 * only a narrow font set out of the box; ASCII-only text keeps the
 * route building without remote-font fetches.
 */

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'nodejs'
// `alt` is *not* exported here. Next falls back to this string only
// when the metadata route consumer omits its own alt — but our
// `generateMetadata` always passes a localized `alt` from
// `messages.<locale>.json::metadata.ogImageAlt`. Exporting an
// English-only fallback would be dead code and an inconsistency
// against the localized chain.

export default async function OpenGraphImage() {
  const pngBuffer = await readFile(
    path.join(process.cwd(), 'public/assets/logo-flask.png'),
  )
  const flask = `data:image/png;base64,${pngBuffer.toString('base64')}`

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 96px',
        fontFamily: 'system-ui',
      }}
    >
      {/* Top: hairline + eyebrow */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 80, height: 1, background: '#F5C21A' }} />
        <div
          style={{
            marginTop: 16,
            color: '#9A9A9A',
            fontSize: 18,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          X Element / Studio
        </div>
      </div>

      {/* Middle: flask + wordmark + tagline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 64,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og runs Satori, which only accepts plain <img> */}
        <img
          src={flask}
          alt=""
          style={{ width: 220, height: 220, objectFit: 'contain' }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              color: '#EAEAEA',
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              display: 'flex',
            }}
          >
            X Element
          </div>
          <div
            style={{
              color: '#EAEAEA',
              fontSize: 32,
              fontWeight: 300,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              maxWidth: 720,
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ marginRight: 8 }}>Intelligent systems.</span>
            <span style={{ color: '#F5C21A' }}>Real impact.</span>
          </div>
        </div>
      </div>

      {/* Bottom: site + status (ASCII-only — no ◆ glyph, Satori can't
            load a font that covers it without a remote fetch). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          color: '#9A9A9A',
          fontSize: 16,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        <span>xelement.studio</span>
        <span style={{ color: '#F5C21A' }}>·</span>
        <span>EX-CORE-01 / Operational</span>
      </div>
    </div>,
    { ...size },
  )
}
