import { setRequestLocale } from 'next-intl/server'
import { Capabilities } from '@/app/_components/Capabilities/Capabilities'
import { FinalCta } from '@/app/_components/FinalCta/FinalCta'
import { Footer } from '@/app/_components/Footer/Footer'
import { Hero } from '@/app/_components/Hero/Hero'
import { Manifesto } from '@/app/_components/Manifesto/Manifesto'
import { Nav } from '@/app/_components/Nav/Nav'
import { Process } from '@/app/_components/Process/Process'
import { Trust } from '@/app/_components/Trust/Trust'
import { Work } from '@/app/_components/Work/Work'

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Trust />
        <Capabilities />
        <Process />
        <Work />
        <Manifesto />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
