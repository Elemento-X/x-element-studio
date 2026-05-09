import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Exo_2, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = localFont({
  src: [
    {
      path: '../public/fonts/Inter_18pt-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Inter_18pt-SemiBold.woff2',
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
  const fontVars = `${inter.variable} ${exo2.variable} ${jetbrainsMono.variable}`
  return (
    <html lang="en" className={fontVars}>
      <body data-atmosphere="signal" data-density="standard" data-accent="gold">
        {children}
      </body>
    </html>
  )
}
