import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Twitter/X card image (1200×630).
 *
 * Same visual + canonical-path rationale as opengraph-image.tsx (lives
 * at app root, served under a single URL across locales). Inlined here
 * (instead of re-exported from opengraph-image) because Next's
 * metadata route loader statically parses these exports at compile
 * time and won't follow a re-export chain.
 */

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'nodejs'
// `alt` intentionally omitted — see opengraph-image.tsx for rationale.

export default async function TwitterImage() {
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
          Elemento-X / Studio
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og runs Satori, which only accepts plain <img> */}
        <img
          src={flask}
          alt=""
          style={{ width: 220, height: 220, objectFit: 'contain' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            Elemento-X
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
        <span>elemento-x.com</span>
        <span style={{ color: '#F5C21A' }}>·</span>
        <span>EX-CORE-01 / Operational</span>
      </div>
    </div>,
    { ...size },
  )
}
