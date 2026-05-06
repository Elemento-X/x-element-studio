import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const inter = localFont({
  src: [
    {
      path: '../public/fonts/Inter_18pt-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/Inter_18pt-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-BoldItalic.ttf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://elemento-x.com'),
  title: {
    default: 'Elemento-X — Intelligent systems. Real impact.',
    template: '%s · Elemento-X',
  },
  description:
    'Elemento-X is a technology studio combining Full Stack, AI Engineering, Product Strategy, and Design Systems to remove bottlenecks and build scalable infrastructure.',
  keywords: [
    'technology studio',
    'AI engineering',
    'full stack',
    'product strategy',
    'design systems',
    'automation',
    'internal tools',
  ],
  authors: [{ name: 'Elemento-X Studio' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://elemento-x.com',
    siteName: 'Elemento-X',
    title: 'Elemento-X — Intelligent systems. Real impact.',
    description:
      'We build the invisible systems behind high-performance products.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Elemento-X — Intelligent systems. Real impact.',
    description:
      'We build the invisible systems behind high-performance products.',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body data-atmosphere="signal" data-density="standard" data-accent="gold">
        {children}
      </body>
    </html>
  )
}
