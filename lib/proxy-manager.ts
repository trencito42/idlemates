import { log } from './logger'
import fs from 'fs'
import path from 'path'

interface ProxyConfig {
  url: string
  type: 'ipv4' | 'ipv6'
  port: number
  isHealthy: boolean
  activeAccounts: number
  location?: string
}

export class ProxyManager {
  private static instance: ProxyManager
  private proxyPool: Map<string, ProxyConfig>
  private accountProxyMap: Map<string, string>
  private rateLimitedProxies: Map<string, number>
  private disabled: boolean

  private constructor() {
    this.proxyPool = new Map()
    this.accountProxyMap = new Map()
    this.rateLimitedProxies = new Map()
    // Allow disabling proxies via env
    const useFlag = (process.env.STEAM_USE_PROXIES || '').toLowerCase()
    const disableFlag = (process.env.STEAM_DISABLE_PROXIES || '').toLowerCase()
    this.disabled = disableFlag === '1' || disableFlag === 'true' || useFlag === '0' || useFlag === 'false'
    this.initializeProxyPool()
  }

  static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager()
    }
    return ProxyManager.instance
  }

  private initializeProxyPool() {
    if (this.disabled) {
      log.warn('🚫 Proxy usage disabled via env (STEAM_DISABLE_PROXIES or STEAM_USE_PROXIES)')
      return
    }
    // Priority: file > URL > env var
    const cwd = process.cwd()
    const candidateFiles = [
      process.env.STEAM_PROXIES_FILE,
      process.env.PROXY_HTTP_LIST_FILE,
      path.join(cwd, 'proxies', 'http.txt'),
      path.join(cwd, 'http.txt')
    ].filter(Boolean) as string[]

    let proxyUrls: (string | { url: string; location?: string })[] | null = null

    for (const filePath of candidateFiles) {
      try {
        if (filePath && fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf8')
          const lines = raw.split(/\r?\n/)
          const parsed = lines
            .map(l => l.trim())
            .filter(l => l && (!l.startsWith('#') || l.includes('://'))) // Allow lines that start with http even if they have # later
            .map(l => {
              const [proxyPart, ...metaParts] = l.split('#')
              const url = (proxyPart.startsWith('http://') || proxyPart.startsWith('https://')) ? proxyPart : `http://${proxyPart}`
              const location = metaParts.join('#').trim()
              return { url, location }
            })
            .filter(p => /:\d{2,5}$/.test(p.url))
          const unique = Array.from(new Set(parsed))
          if (unique.length) {
            proxyUrls = unique
            log.info('📄 Loaded proxies from file', { filePath, count: unique.length })
            break
          }
        }
      } catch (e: any) {
        log.warn('Failed reading proxy list file', { filePath, error: e?.message })
      }
    }

    // Fallback to env var
    if (!proxyUrls) {
      const proxiesEnv = (process.env.STEAM_PROXIES || '').trim()
      if (proxiesEnv) {
        proxyUrls = proxiesEnv.split(',').map(p => p.trim()).filter(Boolean)
        log.info('🧪 Loaded proxies from env STEAM_PROXIES', { count: proxyUrls.length })
      }
    }

    if (!proxyUrls || proxyUrls.length === 0) {
      log.warn('⚠️ No proxies configured (file or STEAM_PROXIES)')
      return
    }

    for (const entry of proxyUrls) {
      const url = typeof entry === 'string' ? entry : entry.url
      const location = typeof entry === 'string' ? undefined : entry.location
      
      const type = url.includes('[') || url.includes('::') ? 'ipv6' : 'ipv4'
      const portMatch = url.match(/:(\d+)/)
      const port = portMatch ? parseInt(portMatch[1]) : 0

      this.proxyPool.set(url, {
        url,
        type,
        port,
        isHealthy: true,
        activeAccounts: 0,
        location
      })
    }

    log.info('🌐 Proxy pool initialized', {
      totalProxies: this.proxyPool.size,
      source: 'file/url/env',
      sample: Array.from(this.proxyPool.keys()).slice(0, 5).map(u => u.replace(/\/\/.*:.*@/, '//***:***@'))
    })
  }

  /**
   * Reload proxies from source (file/url/env). Resets health and assignments.
   */
  reload() {
    this.proxyPool.clear()
    this.accountProxyMap.clear()
    this.rateLimitedProxies.clear()
    this.initializeProxyPool()
    log.info('🔁 Proxy pool reloaded', { totalProxies: this.proxyPool.size })
  }

  async getProxyForAccount(steamAccountId: string, forceProxy: boolean = false): Promise<string | null> {
    if (this.disabled) return null
    
    // Fallback logic: If not forced and we don't have a record of this account needing a proxy, return null (VPS)
    // In a real scenario, we might check DB here, but for now we'll rely on the worker passing forceProxy=true on retry
    if (!forceProxy) {
      // Check if we already have an assignment. If we do, we keep it.
      const existing = this.accountProxyMap.get(steamAccountId)
      if (!existing) return null // No assignment yet, try VPS first
    }

    let existingProxy = this.accountProxyMap.get(steamAccountId)
    
    if (existingProxy && this.proxyPool.has(existingProxy)) {
      return existingProxy
    }

    const newProxy = this.selectBestProxy()
    if (!newProxy) {
      log.warn('No healthy proxy available')
      return null
    }

    this.accountProxyMap.set(steamAccountId, newProxy)
    const proxyConfig = this.proxyPool.get(newProxy)!
    proxyConfig.activeAccounts++

    log.info('✅ Proxy assigned', { 
      steamAccountId: steamAccountId.slice(0, 8) + '***',
      proxy: newProxy.replace(/\/\/.*:.*@/, '//***:***@'),
      location: proxyConfig.location,
      activeAccounts: proxyConfig.activeAccounts
    })

    return newProxy
  }

  getProxyConfig(proxyUrl: string): ProxyConfig | null {
    return this.proxyPool.get(proxyUrl) || null
  }

  private selectBestProxy(): string | null {
    const healthyProxies = Array.from(this.proxyPool.entries())
      .filter(([url, config]) => 
        config.isHealthy && 
        !this.isProxyRateLimited(url)
      )
      .sort((a, b) => a[1].activeAccounts - b[1].activeAccounts)

    return healthyProxies.length > 0 ? healthyProxies[0][0] : null
  }

  private isProxyRateLimited(proxyUrl: string): boolean {
    const expiryTime = this.rateLimitedProxies.get(proxyUrl)
    if (!expiryTime) return false
    if (Date.now() > expiryTime) {
      this.rateLimitedProxies.delete(proxyUrl)
      return false
    }
    return true
  }

  releaseProxy(steamAccountId: string) {
    if (this.disabled) return
    const proxy = this.accountProxyMap.get(steamAccountId)
    if (proxy) {
      const config = this.proxyPool.get(proxy)
      if (config && config.activeAccounts > 0) {
        config.activeAccounts--
      }
      this.accountProxyMap.delete(steamAccountId)
      log.info('🔓 Proxy released', { steamAccountId: steamAccountId.slice(0, 8) + '***', proxy: proxy.replace(/\/\/.*:.*@/, '//***:***@') })
    }
  }

  reportProxySuccess(proxyUrl: string) {
    if (this.disabled) return
    const proxy = this.proxyPool.get(proxyUrl)
    if (proxy) {
      proxy.isHealthy = true
      this.rateLimitedProxies.delete(proxyUrl)
    }
  }

  reportProxyFailure(steamAccountId: string, proxyUrl: string, error: string) {
    if (this.disabled) return
    log.warn('⚠️ Proxy failure', { 
      steamAccountId: steamAccountId.slice(0, 8) + '***',
      proxyUrl: proxyUrl.replace(/\/\/.*:.*@/, '//***:***@'),
      error 
    })

    if (error.includes('RateLimit')) {
      const expiryTime = Date.now() + (30 * 60 * 1000)
      this.rateLimitedProxies.set(proxyUrl, expiryTime)
      log.warn('⏱️ Proxy rate-limited for 30min', { 
        proxyUrl: proxyUrl.replace(/\/\/.*:.*@/, '//***:***@'),
        expiryTime: new Date(expiryTime) 
      })
      
      // CRITICAL: Release this account's proxy assignment so it gets a new one
      this.releaseProxy(steamAccountId)
      log.info('🔄 Account released from rate-limited proxy, will get new proxy on next attempt', {
        steamAccountId: steamAccountId.slice(0, 8) + '***'
      })
    } else {
      const proxy = this.proxyPool.get(proxyUrl)
      if (proxy) {
        proxy.isHealthy = false
      }
    }
  }

  getStats() {
    return {
      disabled: this.disabled,
      totalProxies: this.proxyPool.size,
      healthyProxies: Array.from(this.proxyPool.values()).filter(p => p.isHealthy).length,
      activeAccounts: Array.from(this.proxyPool.values()).reduce((sum, p) => sum + p.activeAccounts, 0),
      rateLimitedProxies: this.rateLimitedProxies.size
    }
  }
}
