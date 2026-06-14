'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession, getProviders } from 'next-auth/react'
import { motion } from 'framer-motion'
import { showError, showSuccess } from '@/lib/sweetalert'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingLink, setSendingLink] = useState(false)
  const [error, setError] = useState('')
  const [hasEmailProvider, setHasEmailProvider] = useState<boolean | null>(null)
  const [linkSent, setLinkSent] = useState(false)

  const registered = searchParams?.get('registered')
  const errorParam = searchParams?.get('error')

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/app/dashboard')
    }
  }, [status, router])

  // Detect whether magic-link (Email) provider is available
  useEffect(() => {
    let cancelled = false
    getProviders().then((p) => {
      if (!cancelled) setHasEmailProvider(Boolean(p && (p as any).email))
    }).catch(() => {
      if (!cancelled) setHasEmailProvider(false)
    })
    return () => { cancelled = true }
  }, [])

  // Show a one-time toast if user just registered
  useEffect(() => {
    if (registered) {
      showSuccess('Account created! You can now sign in.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registered])

  // If NextAuth pushed an error via query, surface it and normalize the callbackUrl
  useEffect(() => {
    if (errorParam) {
      showError('Sign-in link is invalid or expired. Request a new magic link.')
      // Clean the URL to avoid nested callback chains
      const url = new URL(window.location.href)
      url.searchParams.delete('callbackUrl')
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorParam])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <i className="fa-duotone fa-spinner-third fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if authenticated (will redirect)
  if (status === 'authenticated') {
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        // Avoid nested callbackUrl chains
        callbackUrl: '/app/dashboard'
      })

      if (result?.error) {
        const err = String(result.error)
        if (err.startsWith('TOTP_REQUIRED:')) {
          const challenge = err.split(':')[1]
          const url = new URL('/auth/2fa', window.location.origin)
          url.searchParams.set('challenge', challenge)
          url.searchParams.set('callbackUrl', '/app/dashboard')
          router.push(url.toString())
          return
        }
        // Recover challenge if NextAuth swallowed our custom error
        try {
          const rec = await fetch(`/api/auth/totp-challenge?email=${encodeURIComponent(email.toLowerCase())}`)
          if (rec.ok) {
            const d = await rec.json()
            if (d.challenge) {
              const url = new URL('/auth/2fa', window.location.origin)
              url.searchParams.set('challenge', d.challenge)
              url.searchParams.set('callbackUrl', '/app/dashboard')
              router.push(url.toString())
              return
            }
          }
        } catch {}
        throw new Error('Invalid email or password')
      }

      showSuccess('Signed in! Redirecting…')
      router.push('/app/dashboard')
    } catch (err: any) {
      setError(err.message)
      showError(err.message || 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Enter your email first')
      showError('Enter your email first')
      return
    }
    if (hasEmailProvider === false) {
      setError('Magic links are temporarily unavailable')
      showError('Magic links are temporarily unavailable')
      return
    }
    try {
      setSendingLink(true)
  const res = await signIn('email', { email, redirect: false, callbackUrl: '/app/dashboard' })
      if ((res as any)?.error) throw new Error('Failed to send magic link')
      setLinkSent(true)
      showSuccess('Email sent! Check your inbox for the sign-in link')
      // Auto-hide after a short while
      setTimeout(() => setLinkSent(false), 7000)
    } catch (err: any) {
      setError(err.message)
      showError(err.message || 'Failed to send magic link')
    } finally {
      setSendingLink(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center py-12 px-4 bg-bg">
      {/* Left side with logo */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 max-w-md px-8 mb-8 md:mb-0"
      >
        <Link href="/" className="block relative group">
          <div className="relative flex items-center justify-center gap-4 p-8 group">
            <div className="relative">
              <motion.div 
                className="absolute -inset-1 bg-primary/20 rounded-full blur-md"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.3, 0.2]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <img src="/logo.svg" alt="IdleMates" className="w-16 h-16 relative z-10" />
            </div>
            <span className="text-3xl font-bold text-fg">
              IdleMates
            </span>
          </div>
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center md:text-left mt-8 space-y-4"
        >
          <h2 className="text-2xl font-bold text-fg">Welcome back!</h2>
          <p className="text-muted">Sign in to manage your Steam accounts and monitor your idling sessions.</p>
        </motion.div>
      </motion.div>

      {/* Right side with form */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 max-w-md"
      >
        <div className="card bg-card p-8 border border-white/10 rounded-xl shadow-lg">
          {/* Toasts replace inline banners */}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-fg mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-fg placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 text-base"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-fg placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200 text-base"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn w-full py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
            <div className="text-center">
              <Link href="/auth/reset" className="text-sm text-primary hover:underline">Forgot your password?</Link>
            </div>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <form onSubmit={sendMagicLink} className="space-y-3">
              <button
                type="submit"
                className="btn-secondary w-full"
                disabled={sendingLink || !email || hasEmailProvider === false}
                title={hasEmailProvider === false ? 'Email sign-in is not configured' : undefined}
              >
                {hasEmailProvider === false
                  ? 'Magic link unavailable'
                  : sendingLink
                    ? 'Sending link…'
                    : (linkSent ? 'Link sent!' : 'Send magic link to email')}
              </button>
              <p className="text-xs text-muted text-center">
                {hasEmailProvider === false
                  ? 'Email sign-in is not configured on this server.'
                  : 'We’ll email you a sign-in link. No password needed.'}
              </p>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-muted">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:brightness-110 font-medium transition duration-200">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
