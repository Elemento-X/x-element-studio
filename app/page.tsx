import { Capabilities } from './_components/Capabilities/Capabilities'
import { FinalCta } from './_components/FinalCta/FinalCta'
import { Footer } from './_components/Footer/Footer'
import { Hero } from './_components/Hero/Hero'
import { Manifesto } from './_components/Manifesto/Manifesto'
import { Nav } from './_components/Nav/Nav'
import { Process } from './_components/Process/Process'
import { Trust } from './_components/Trust/Trust'
import { Work } from './_components/Work/Work'

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
