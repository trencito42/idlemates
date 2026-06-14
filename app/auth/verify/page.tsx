import { Suspense } from 'react'
import dyn from 'next/dynamic'

export const dynamic = 'force-dynamic'

const VerifyClient = dyn(() => import('@/components/VerifyClient'), { ssr: false })

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyClient />
    </Suspense>
  )
}
