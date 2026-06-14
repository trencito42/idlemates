import type { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Pricing — IdleMates',
  description: "Your games never sleep. Simple pricing for your cloud buddy—we're upfront about costs, just like good friends should be.",
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing — IdleMates',
    description: "Your games never sleep. Simple pricing for your cloud buddy—we're upfront about costs, just like good friends should be.",
    type: 'website',
    images: ['/api/og?title=Pricing%20%E2%80%94%20IdleMates&subtitle=Simple%2C%20honest%20pricing%20for%20your%20cloud%20buddy%20on%20Steam.%20Start%20free%20and%20upgrade%20anytime.']
  },
  twitter: {
    title: 'Pricing — IdleMates',
    description: "Your games never sleep. Simple pricing for your cloud buddy—we're upfront about costs, just like good friends should be.",
    images: ['/api/og?title=Pricing%20%E2%80%94%20IdleMates&subtitle=Simple%2C%20honest%20pricing%20for%20your%20cloud%20buddy%20on%20Steam.%20Start%20free%20and%20upgrade%20anytime.']
  }
}

export default function PricingPage() {
  return (
    <main>
      <PricingClient />
    </main>
  )
}
