import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Apple touch icon (512×512).
 *
 * Used by Safari iOS / Android Chrome for "Add to Home Screen", and
 * referenced by the JSON-LD `Organization.logo` field. 512×512 is the
 * single size that satisfies all three consumers:
 *   - iOS: any size ≥120×120 (iOS scales down; 512 gives crisp pinned
 *     tile on Retina home screen).
 *   - Android: 512 is the PWA-manifest canonical size.
 *   - Google Logo guideline: recommends a square PNG ≥112×112, and
 *     considers 600×600+ ideal for knowledge-panel rich results. 512
 *     is above the minimum and within the comfortable range — going
 *     higher only matters once we ship a vectorized wordmark.
 *
 * Visual mirrors `app/icon.tsx` (gold background, dark flask) so the
 * brand reads consistent across favicon, pinned tile, and SERP logo.
 */

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'
export const runtime = 'nodejs'

export default async function AppleIcon() {
  const pngBuffer = await readFile(
    path.join(process.cwd(), 'public/assets/logo-flask.png'),
  )
  const flask = `data:image/png;base64,${pngBuffer.toString('base64')}`

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#F5C21A',
        borderRadius: '22.5%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og runs Satori, which only accepts plain <img>; next/image is not supported here */}
      <img
        src={flask}
        alt=""
        style={{ width: '72%', height: '72%', objectFit: 'contain' }}
      />
    </div>,
    { ...size },
  )
}
