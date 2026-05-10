'use client'

import dynamic from 'next/dynamic'

// Lazy boundary for the contact form.
//
// ContactForm pulls in react-hook-form + zod + @hookform/resolvers — about
// 340KB raw / 85KB gzip vendor chunk. Without this boundary, that bundle
// ships in the First Load JS of the landing page, so every visitor pays
// the cost even if they never scroll to the contact section.
//
// ssr: false is fine here: the form is client-interactive (RHF state +
// fetch). Server-rendered markup wouldn't speed up time-to-interaction.
//
// loading: null avoids a layout flash; the host card already provides
// visual structure (border + padding), and hydration on a modern device
// completes within ~50-150ms — short enough that no skeleton is needed.
//
// FinalCta imports this file (NOT the underlying ContactForm) when the
// kill-switch is on.
export const ContactForm = dynamic(
  () => import('./ContactForm').then((m) => ({ default: m.ContactForm })),
  { ssr: false, loading: () => null },
)
