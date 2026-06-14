'use client'

import { useEffect, useRef, useState } from 'react'

// Utilities for Web Crypto
const enc = new TextEncoder()
const dec = new TextDecoder()

function toBase64(arr: ArrayBuffer | Uint8Array) {
  const bin = String.fromCharCode(...new Uint8Array(arr as ArrayBuffer))
  return btoa(bin)
}
function fromBase64(b64: string) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
function toHex(arr: Uint8Array) {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexDump(bytes: Uint8Array): string[] {
  const lines: string[] = []
  const toAscii = (b: number) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')
  for (let i = 0; i < bytes.length; i += 16) {
    const slice = bytes.slice(i, i + 16)
    const hex = Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(slice).map(toAscii).join('')
    lines.push(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(16 * 3 - 1, ' ')}  |${ascii}|`)
  }
  return lines
}

async function importAesKey(raw: Uint8Array, usage: KeyUsage[]) {
  // Cast to ArrayBuffer to appease TS DOM BufferSource types
  return window.crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, usage)
}

async function aesGcmEncrypt(key: CryptoKey, iv: Uint8Array, data: Uint8Array) {
  const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, data.buffer as ArrayBuffer)
  // Split tag (last 16 bytes) like our blob layout: version | iv | tag | ciphertext
  const buf = new Uint8Array(ct)
  const tag = buf.slice(buf.byteLength - 16)
  const ciphertext = buf.slice(0, buf.byteLength - 16)
  return { ciphertext, tag }
}

async function aesGcmDecrypt(key: CryptoKey, iv: Uint8Array, ciphertext: Uint8Array, tag: Uint8Array) {
  // Browser combines tag with ciphertext at the end
  const merged = new Uint8Array(ciphertext.byteLength + tag.byteLength)
  merged.set(ciphertext, 0)
  merged.set(tag, ciphertext.byteLength)
  const pt = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, merged.buffer as ArrayBuffer)
  return new Uint8Array(pt)
}

function rand(len: number) {
  const out = new Uint8Array(len)
  window.crypto.getRandomValues(out)
  return out
}

export default function LiveCryptoDemo() {
  const [username, setUsername] = useState('my_login')
  const [password, setPassword] = useState('my_password')
  const [totp, setTotp] = useState('123456')
  const [sharedSecret, setSharedSecret] = useState('')
  const [blobB64, setBlobB64] = useState<string>('')
  const [wrappedB64, setWrappedB64] = useState<string>('')
  const [decrypted, setDecrypted] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [demoMasterKey, setDemoMasterKey] = useState<Uint8Array | null>(null)
  const [keyFp, setKeyFp] = useState<string>('')
  const [parsed, setParsed] = useState<{ v: number; ivLen: number; tagLen: number; ctLen: number } | null>(null)
  const [parsedWrap, setParsedWrap] = useState<{ v: number; ivLen: number; tagLen: number; ctLen: number } | null>(null)
  const [serverOk, setServerOk] = useState<string>('')
  const [encSource, setEncSource] = useState<'local' | 'server' | ''>('')
  const [showParsedData, setShowParsedData] = useState(false)
  const [showParsedWrap, setShowParsedWrap] = useState(false)
  const dataDrawerRef = useRef<HTMLDivElement>(null)
  const wrapDrawerRef = useRef<HTMLDivElement>(null)

  const version = 1 // 0x01

  useEffect(() => {
    // Only runs in browser; avoids window usage during prerender
    const k = rand(32)
    setDemoMasterKey(k)
    setKeyFp(toHex(k).slice(0, 8))
  }, [])

  const rotateKey = () => {
    if (busy) return
    const k = rand(32)
    setDemoMasterKey(k)
    setKeyFp(toHex(k).slice(0, 8))
    // Clear outputs so previous blobs won't decrypt with the new key
    setBlobB64('')
    setWrappedB64('')
    setDecrypted('')
  }

  const run = async () => {
    try {
      setBusy(true)
      setDecrypted('')
      setServerOk('')
      // 1) Generate per-record data key
      const dataKeyRaw = rand(32)
      const dataKey = await importAesKey(dataKeyRaw, ['encrypt', 'decrypt'])
      // 2) Encrypt record
      const iv = rand(12)
      const payload = JSON.stringify({ username, password, totp, shared_secret: sharedSecret })
      const { ciphertext, tag } = await aesGcmEncrypt(dataKey, iv, enc.encode(payload))
  // 3) Envelope: wrap data key with master key (demo-only key)
  if (!demoMasterKey) throw new Error('Demo master key not ready')
  const masterKey = await importAesKey(demoMasterKey, ['encrypt', 'decrypt'])
      const wrapIv = rand(12)
      const wrapped = await aesGcmEncrypt(masterKey, wrapIv, dataKeyRaw)
      const wrappedBlob = new Uint8Array(1 + 12 + 16 + wrapped.ciphertext.byteLength)
      wrappedBlob[0] = version
      wrappedBlob.set(wrapIv, 1)
      wrappedBlob.set(wrapped.tag, 13)
      wrappedBlob.set(wrapped.ciphertext, 29)
      setWrappedB64(toBase64(wrappedBlob))
      // 4) Data blob (versioned)
      const out = new Uint8Array(1 + 12 + 16 + ciphertext.byteLength)
      out[0] = version
      out.set(iv, 1)
      out.set(tag, 13)
      out.set(ciphertext, 29)
      setBlobB64(toBase64(out))
  // Update parsed info
      setParsed({ v: version, ivLen: iv.byteLength, tagLen: tag.byteLength, ctLen: ciphertext.byteLength })
      setParsedWrap({ v: version, ivLen: wrapIv.byteLength, tagLen: wrapped.tag.byteLength, ctLen: wrapped.ciphertext.byteLength })
  setEncSource('local')
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    try {
      setBusy(true)
      const blob = fromBase64(blobB64)
      if (blob.byteLength < 29) throw new Error('Blob too short')
      const v = blob[0]
      if (v !== version) throw new Error('Unsupported version')
      const iv = blob.slice(1, 13)
      const tag = blob.slice(13, 29)
      const ciphertext = blob.slice(29)
  if (!demoMasterKey) throw new Error('Demo master key not ready')
  const wrap = fromBase64(wrappedB64)
      if (wrap.byteLength < 29) throw new Error('Wrapped too short')
      const wrapIv = wrap.slice(1, 13)
      const wrapTag = wrap.slice(13, 29)
      const wrapCt = wrap.slice(29)
  const masterKey = await importAesKey(demoMasterKey, ['encrypt', 'decrypt'])
      const dataKeyRaw = await aesGcmDecrypt(masterKey, wrapIv, wrapCt, wrapTag)
      const dataKey = await importAesKey(dataKeyRaw, ['encrypt', 'decrypt'])
      const pt = await aesGcmDecrypt(dataKey, iv, ciphertext, tag)
      setDecrypted(dec.decode(pt))
    } finally {
      setBusy(false)
    }
  }

  const parseBlob = (b64: string) => {
    try {
      const buf = fromBase64(b64)
      if (buf.byteLength < 29) return null
      const v = buf[0]
      const ivLen = 12
      const tagLen = 16
      const ctLen = buf.byteLength - 29
      return { v, ivLen, tagLen, ctLen }
    } catch {
      return null
    }
  }

  const decodeBlob = (b64: string) => {
    try {
      const buf = fromBase64(b64)
      if (buf.byteLength < 29) return null
      const v = buf[0]
      const iv = buf.slice(1, 13)
      const tag = buf.slice(13, 29)
      const ct = buf.slice(29)
      return { v, iv, tag, ct, raw: buf }
    } catch { return null }
  }

  const serverVerify = async () => {
    try {
      setBusy(true)
      setServerOk('')
      const res = await fetch('/api/security/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataBlobB64: blobB64, wrappedKeyBlobB64: wrappedB64 })
      })
      const json = await res.json()
      if (res.status === 503) setServerOk('Server verification unavailable: ENCRYPTION_MASTER_KEY is not set')
      else if (json?.ok) setServerOk(`Verified on server • decrypted ${json.bytes} bytes`)
      else setServerOk('Server verification failed (ensure blobs were encrypted on server with the same key)')
    } catch {
      setServerOk('Server verification failed')
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  const hexPreview = (b64: string, max = 48) => {
    try {
      const buf = fromBase64(b64)
      const slice = buf.slice(0, Math.min(buf.length, max))
      return Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join(' ') + (buf.length > max ? ' …' : '')
    } catch { return '' }
  }

  const serverEncrypt = async () => {
    try {
      setBusy(true)
      setDecrypted('')
      setServerOk('')
      const res = await fetch('/api/security/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, totp, shared_secret: sharedSecret })
      })
      const json = await res.json()
      if (json?.ok) {
        setBlobB64(json.dataBlobB64)
        setWrappedB64(json.wrappedKeyBlobB64)
        setParsed(parseBlob(json.dataBlobB64))
        setParsedWrap(parseBlob(json.wrappedKeyBlobB64))
        setServerOk('Encrypted on server • blobs ready')
        setEncSource('server')
      } else {
        setServerOk('Server encryption failed')
      }
    } catch {
      setServerOk('Server encryption failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
        <span>Using temporary in-browser master key</span>
        {keyFp && (
          <span className="px-2 py-0.5 rounded bg-white/5 border border-border/10 text-white/70">fp:{keyFp}</span>
        )}
        <button disabled={busy} onClick={rotateKey} className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 border border-border/10 text-white/80 disabled:opacity-50">
          <i className="fa-duotone fa-rotate"></i> Rotate key
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input className="w-full rounded-lg bg-white/5 border border-border/10 p-3 text-sm" value={username} onChange={e => setUsername(e.target.value)} />
          <label className="block text-sm font-medium mt-3 mb-2">Password</label>
          <input type="password" className="w-full rounded-lg bg-white/5 border border-border/10 p-3 text-sm" value={password} onChange={e => setPassword(e.target.value)} />
          <label className="block text-sm font-medium mt-3 mb-2">TOTP</label>
          <input className="w-full rounded-lg bg-white/5 border border-border/10 p-3 text-sm" value={totp} onChange={e => setTotp(e.target.value)} />
          <label className="block text-sm font-medium mt-3 mb-2">shared_secret (optional)</label>
          <input className="w-full rounded-lg bg-white/5 border border-border/10 p-3 text-sm" value={sharedSecret} onChange={e => setSharedSecret(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-3">
            <button disabled={busy || !demoMasterKey} onClick={run} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white disabled:opacity-50">
              <i className="fa-duotone fa-lock-keyhole" /> Encrypt locally
            </button>
            <button disabled={busy} onClick={serverEncrypt} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-border/10 text-white disabled:opacity-50">
              <i className="fa-duotone fa-server" /> Encrypt on server
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Versioned data blob (base64)</label>
          <textarea className="w-full rounded-lg bg-white/5 border border-border/10 p-3 text-xs font-mono" rows={4} value={blobB64} readOnly />
          <div className="mt-2 text-xs text-white/60 flex items-center gap-3">
            <button onClick={() => setParsed(parseBlob(blobB64))} className="px-2 py-1 rounded bg-white/10 border border-border/10">Parse blob</button>
            <button onClick={() => copy(blobB64)} className="px-2 py-1 rounded bg-white/10 border border-border/10">Copy</button>
            {parsed && (
              <span>
                v={parsed.v} • iv={parsed.ivLen} (1..13) • tag={parsed.tagLen} (13..29) • ct={parsed.ctLen} (29..N)
              </span>
            )}
          </div>
          {blobB64 && (
            <div className="mt-2 text-[10px] text-white/50 font-mono break-words">
              hex: {hexPreview(blobB64)}
            </div>
          )}
          <label className="block text-sm font-medium mt-4 mb-2">Wrapped data key (base64)</label>
                <button onClick={() => setShowParsedData(v => !v)} className="ml-auto px-2 py-1 rounded bg-white/10 border border-border/10">
                  {showParsedData ? 'Hide fields' : 'Show parsed fields'}
                </button>
          <textarea className="w-full rounded-lg bg-white/5 border border-border/10 p-3 text-xs font-mono" rows={3} value={wrappedB64} readOnly />
          <div className="mt-2 text-xs text-white/60 flex items-center gap-3">
            <button onClick={() => setParsedWrap(parseBlob(wrappedB64))} className="px-2 py-1 rounded bg-white/10 border border-border/10">Parse blob</button>
            <button onClick={() => copy(wrappedB64)} className="px-2 py-1 rounded bg-white/10 border border-border/10">Copy</button>
            {parsedWrap && (
              <span>
              {/* Animated drawer for data blob */}
              <div
                ref={dataDrawerRef}
                style={{
                  maxHeight: showParsedData && dataDrawerRef.current ? dataDrawerRef.current.scrollHeight + 16 : 0,
                  opacity: showParsedData ? 1 : 0,
                  transition: 'max-height 300ms ease, opacity 200ms ease',
                  overflow: 'hidden'
                }}
                className="mt-3 rounded-lg bg-white/5 border border-border/10 p-3"
              >
                {decodeBlob(blobB64) && (
                  <div className="space-y-2 text-[11px]">
                    {(() => {
                      const d = decodeBlob(blobB64)!
                      const ivHex = toHex(d.iv)
                      const tagHex = toHex(d.tag)
                      const dump = hexDump(d.raw)
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>version: 0x{d.v.toString(16).padStart(2, '0')} @ 0x0000</div>
                            <div>iv[12]: @ 0x0001..0x000C</div>
                            <div>tag[16]: @ 0x000D..0x001C</div>
                            <div>ciphertext[{d.ct.byteLength}]: @ 0x001D..end</div>
                          </div>
                          <div className="font-mono break-words">iv: {ivHex}</div>
                          <div className="font-mono break-words">tag: {tagHex}</div>
                          <div className="mt-2 font-mono text-[10px] bg-black/30 rounded p-2 overflow-auto max-h-56">
                            <pre>{dump.join('\n')}</pre>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
                v={parsedWrap.v} • iv={parsedWrap.ivLen} (1..13) • tag={parsedWrap.tagLen} (13..29) • ct={parsedWrap.ctLen} (29..N)
              </span>
            )}
          </div>
          {wrappedB64 && (
            <div className="mt-2 text-[10px] text-white/50 font-mono break-words">
              hex: {hexPreview(wrappedB64)}
            </div>
          )}
          <button disabled={busy || !demoMasterKey || !blobB64 || !wrappedB64} onClick={verify} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-border/10 text-white disabled:opacity-50">
                <button onClick={() => setShowParsedWrap(v => !v)} className="ml-auto px-2 py-1 rounded bg-white/10 border border-border/10">
                  {showParsedWrap ? 'Hide fields' : 'Show parsed fields'}
                </button>
            <i className="fa-duotone fa-unlock-keyhole" /> Decrypt to Verify
              {/* Animated drawer for wrapped key */}
              <div
                ref={wrapDrawerRef}
                style={{
                  maxHeight: showParsedWrap && wrapDrawerRef.current ? wrapDrawerRef.current.scrollHeight + 16 : 0,
                  opacity: showParsedWrap ? 1 : 0,
                  transition: 'max-height 300ms ease, opacity 200ms ease',
                  overflow: 'hidden'
                }}
                className="mt-3 rounded-lg bg-white/5 border border-border/10 p-3"
              >
                {decodeBlob(wrappedB64) && (
                  <div className="space-y-2 text-[11px]">
                    {(() => {
                      const d = decodeBlob(wrappedB64)!
                      const ivHex = toHex(d.iv)
                      const tagHex = toHex(d.tag)
                      const dump = hexDump(d.raw)
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>version: 0x{d.v.toString(16).padStart(2, '0')} @ 0x0000</div>
                            <div>iv[12]: @ 0x0001..0x000C</div>
                            <div>tag[16]: @ 0x000D..0x001C</div>
                            <div>ciphertext[{d.ct.byteLength}]: @ 0x001D..end</div>
                          </div>
                          <div className="font-mono break-words">iv: {ivHex}</div>
                          <div className="font-mono break-words">tag: {tagHex}</div>
                          <div className="mt-2 font-mono text-[10px] bg-black/30 rounded p-2 overflow-auto max-h-56">
                            <pre>{dump.join('\n')}</pre>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
          </button>
          <button disabled={busy || !blobB64 || !wrappedB64 || encSource !== 'server'} onClick={serverVerify} className="mt-3 ml-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary disabled:opacity-50" title={encSource !== 'server' ? 'Use “Encrypt on server” first' : ''}>
            <i className="fa-duotone fa-shield-check" /> Verify on Server
          </button>
          {serverOk && (
            <div className="mt-2 text-xs text-white/70">{serverOk}</div>
          )}
        </div>
      </div>
      {decrypted && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-200 text-sm">
          <div className="font-semibold mb-1">Decrypted result</div>
          <div className="font-mono whitespace-pre-wrap break-words">{decrypted}</div>
        </div>
      )}
      <p className="text-white/50 text-xs">Demo runs fully in your browser using Web Crypto (AES‑GCM). No data leaves your device. In production, the master key never reaches the browser, so blobs are undecryptable without server access.</p>
    </div>
  )
}
