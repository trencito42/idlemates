'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/app/components/ui/theme-provider'
import { ClientLayout, preloadCriticalComponents } from './ClientLayout'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start preloading critical components after initial render
    preloadCriticalComponents()
  }, [])

  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="idlemat-ui-theme">
        <ClientLayout>
          {children}
        </ClientLayout>
      </ThemeProvider>
    </SessionProvider>
  )
}
