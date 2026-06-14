'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { showError, showSuccess } from '@/lib/sweetalert'

export default function RegisterPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registrationsEnabled, setRegistrationsEnabled] = useState<boolean | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/app/dashboard')
    }
  }, [status, router])

  // Load system setting to reflect disabled sign-ups (must be before any conditional returns)
  useEffect(() => {
    let cancelled = false
    fetch('/api/settings')
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d?.settings)
          setRegistrationsEnabled(Boolean(d.settings.allowNewRegistrations))
      })
      .catch(() => setRegistrationsEnabled(null))
    return () => {
      cancelled = true
    }
  }, [])

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
      if (registrationsEnabled === false) {
        throw new Error('Sign-ups are currently disabled')
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      showSuccess('Account created! You can now sign in.')
      router.push('/auth/login?registered=true')
    } catch (err: any) {
      setError(err.message)
      showError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
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
          <h2 className="text-2xl font-bold text-fg">Level up your Steam idling</h2>
          <p className="text-muted">Create an account to unlock automated account management, multi-game idling, and real-time monitoring—no scripts required.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-start gap-3">
              <i className="fa-duotone fa-rocket text-primary mt-1"></i>
              <div>
                <div className="text-fg font-medium">Fast setup</div>
                <div className="text-muted text-sm">Get started in minutes—no complex config.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fa-duotone fa-shield-check text-primary mt-1"></i>
              <div>
                <div className="text-fg font-medium">Secure by design</div>
                <div className="text-muted text-sm">AES‑GCM encrypted secrets, role-based access.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fa-duotone fa-gamepad-modern text-primary mt-1"></i>
              <div>
                <div className="text-fg font-medium">Multi‑game idling</div>
                <div className="text-muted text-sm">Idle multiple titles with smart scheduling.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <i className="fa-duotone fa-chart-line text-primary mt-1"></i>
              <div>
                <div className="text-fg font-medium">Live session insights</div>
                <div className="text-muted text-sm">Real game names, status, and usage caps.</div>
              </div>
            </div>
          </div>
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 text-fg">Create your account</h1>
            <p className="text-primary">Get 100 free hours to try IdleMates</p>
          </div>

          {/* Replaced inline error banner with toasts */}

          {registrationsEnabled === false && (
            <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 px-4 py-3 text-sm">
              <i className="fa-duotone fa-triangle-exclamation mr-2"></i>
              Sign-ups are currently disabled.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-fg mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-fg placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-fg placeholder-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition duration-200"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p className="text-xs text-muted mt-2">Minimum 8 characters</p>
            </div>

            <motion.button
              type="submit"
              disabled={loading || registrationsEnabled === false}
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
                  Creating...
                </span>
              ) : (
                'Create Account'
              )}
            </motion.button>

            <div className="flex items-center justify-center gap-6 text-sm text-muted pt-4 flex-wrap">
              <div className="flex items-center gap-2"><i className="fa-duotone fa-circle-check text-success"></i> 100 free hours</div>
              <div className="flex items-center gap-2"><i className="fa-duotone fa-circle-check text-success"></i> Cancel anytime</div>
              <div className="flex items-center gap-2"><i className="fa-duotone fa-circle-check text-success"></i> No credit card required</div>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-muted">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:brightness-110 font-medium transition duration-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          By creating an account, you agree to our{' '}
          <Link href="/legal/tos" className="text-primary hover:brightness-110">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="text-primary hover:brightness-110">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  )
}