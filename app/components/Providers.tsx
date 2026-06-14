'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/app/components/ui/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="idlemat-ui-theme">
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
