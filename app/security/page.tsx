import type { Metadata } from 'next'
import Link from 'next/link'
import LiveCryptoDemo from '@/components/security/LiveCryptoDemo'

export const metadata: Metadata = {
  title: 'Security — IdleMates',
  description:
    'How IdleMates protects your data: AES-256-GCM at rest, envelope encryption with a 32-byte master key, versioned blobs with IV and tag.',
  alternates: { canonical: '/security' },
  openGraph: {
    title: 'Security — IdleMates',
    description: 'How IdleMates protects your data: AES-256-GCM at rest, envelope encryption with a 32-byte master key, versioned blobs with IV and tag.',
    images: ['/api/og?title=Security%20%E2%80%94%20IdleMates&subtitle=Military-grade%20encryption%20keeps%20your%20Steam%20account%20safe']
  },
  twitter: {
    title: 'Security — IdleMates',
    description: 'How IdleMates protects your data: AES-256-GCM at rest, envelope encryption with a 32-byte master key, versioned blobs with IV and tag.',
    images: ['/api/og?title=Security%20%E2%80%94%20IdleMates&subtitle=Military-grade%20encryption%20keeps%20your%20Steam%20account%20safe']
  }
}

export default function SecurityPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/70 to-bg z-[1] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-bg z-[1] pointer-events-none" />
        <div className="relative z-10 mx-auto px-6 py-20 md:py-32">
          <div className="text-center space-y-6 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-xl text-sm font-medium text-primary shadow-lg shadow-primary/20">
              <i className="fa-duotone fa-shield-check"></i>
              <span className="text-primary font-semibold">Security</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black">
              <span className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Your data, protected</span>
            </h1>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              AES‑256‑GCM for data at rest with envelope encryption. Versioned blobs include IV and authentication tag.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-12 md:py-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-white/55 text-sm">
              <i className="fa-duotone fa-lock text-accent/90"></i>
              <span className="text-center">AES-256-GCM at rest • Master-key envelope • Authenticated encryption (GCM)</span>
            </div>
          </header>

          <section className="card p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold">At a glance</h2>
            <ul className="list-disc pl-6 space-y-2 text-white/80">
              <li>Data at rest: AES‑256‑GCM (authenticated encryption)</li>
              <li>Per‑record data key: 32 bytes (random)</li>
              <li>Envelope encryption: data key wrapped with a 32‑byte master key via AES‑256‑GCM</li>
              <li>IV: 12 bytes per NIST recommendation for GCM</li>
              <li>Tag: 16 bytes (GCM authentication tag)</li>
              <li>Blobs: versioned; we currently use version 0x01</li>
            </ul>
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            <div className="card p-6 space-y-3">
              <h3 className="text-xl font-semibold">How it works</h3>
              <ol className="list-decimal pl-5 space-y-2 text-white/80">
                <li>Generate a 32‑byte data key for the record.</li>
                <li>Encrypt the record with AES‑256‑GCM using that data key.</li>
                <li>Envelope encrypt the data key using a 32‑byte master key (from ENCRYPTION_MASTER_KEY).</li>
                <li>Store: encrypted record + wrapped data key.</li>
              </ol>
              <p className="text-white/60 text-sm">
                Master key format: either 32‑byte base64 or 64‑hex characters. We include a 1‑byte version prefix to allow safe future changes.
              </p>
            </div>

            <div className="card p-6 space-y-3">
              <h3 className="text-xl font-semibold">Blob layout</h3>
              <ul className="text-white/80 space-y-1">
                <li>0..1: version (0x01)</li>
                <li>1..13: IV (12 bytes)</li>
                <li>13..29: tag (16 bytes)</li>
                <li>29..N: ciphertext</li>
              </ul>
              <div className="mt-3 rounded-lg bg-white/5 border border-border/10 p-3 overflow-auto">
                <code className="text-xs text-white/80">base64(version || iv || tag || ciphertext)</code>
              </div>
            </div>
          </section>

          <section className="card p-6 md:p-8 space-y-3">
            <h3 className="text-xl font-semibold">Redacted example</h3>
            <p className="text-white/70 text-sm">
              Example of a versioned, envelope‑encrypted data key blob (base64):
            </p>
            <div className="rounded-xl bg-white/5 border border-border/10 p-4 font-mono text-xs text-white/80">
              AQAAAAAAAAAAABCD1234AAAAAAAAAAAAAAABCD1234••••••••••••••••••••••••••••••••••••
            </div>
            <p className="text-white/60 text-xs">Note: contents are illustrative; sensitive portions are redacted.</p>
          </section>

          <section className="card p-6 md:p-8 space-y-4">
            <h3 className="text-xl font-semibold">Try it live (client-side demo)</h3>
            <p className="text-white/70 text-sm">Run a local encryption to see exactly how records are encrypted and keys are wrapped. This uses your browser’s Web Crypto API (AES‑GCM); no data leaves your device.</p>
            <LiveCryptoDemo />
          </section>

          <section className="card p-6 md:p-8 space-y-4">
            <h3 className="text-xl font-semibold">Server code examples</h3>
            <p className="text-white/70 text-sm">These helpers live in <code className="font-mono">lib/crypto.ts</code> and are used by the worker when storing credentials securely.</p>
            <div className="rounded-xl bg-white/5 border border-border/10 p-4 font-mono text-xs text-white/80 overflow-auto">
{`import { generateDataKey, encryptWithDataKey, envelopeEncryptDataKey, envelopeDecryptDataKey, decryptWithDataKey } from '@/lib/crypto'

// Encrypt and wrap
const dataKey = generateDataKey()
const dataBlobB64 = encryptWithDataKey(dataKey, JSON.stringify(record))
const wrappedKeyB64 = envelopeEncryptDataKey(dataKey)

// Later: unwrap and decrypt
const unwrappedKey = envelopeDecryptDataKey(wrappedKeyB64)
const plaintext = decryptWithDataKey(unwrappedKey, dataBlobB64)`}
            </div>
          </section>

          <section className="card p-6 md:p-8 space-y-3">
            <h3 className="text-xl font-semibold">Responsible disclosure</h3>
            <p className="text-white/80">
              If you believe you’ve found a security issue, please reach out at{' '}
              <a className="text-accent underline" href="mailto:security@idlemat.es">security@idlemat.es</a>.
            </p>
            <p className="text-white/60 text-sm">
              See also our <Link href="/legal/privacy" className="text-accent underline">Privacy Policy</Link> and{' '}
              <Link href="/legal/tos" className="text-accent underline">Terms of Service</Link>.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
