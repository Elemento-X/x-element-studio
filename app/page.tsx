import { Capabilities } from '@/components/landing/Capabilities/Capabilities'
import { FinalCta } from '@/components/landing/FinalCta/FinalCta'
import { Footer } from '@/components/landing/Footer/Footer'
import { Hero } from '@/components/landing/Hero/Hero'
import { Manifesto } from '@/components/landing/Manifesto/Manifesto'
import { Nav } from '@/components/landing/Nav/Nav'
import { Process } from '@/components/landing/Process/Process'
import { Trust } from '@/components/landing/Trust/Trust'
import { Work } from '@/components/landing/Work/Work'

export default function Home() {
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
