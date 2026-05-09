import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'
export const runtime = 'nodejs'

export default async function Icon() {
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
        borderRadius: '12.5%',
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
