#!/usr/bin/env node

/**
 * SEO Audit Script for IdleMates
 * 
 * This script performs a comprehensive SEO audit of all pages:
 * - Checks OG images are working
 * - Validates metadata completeness
 * - Ensures all pages use new "Cloud Buddy" branding
 * - Tests page loading and response codes
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const SITE_URL = process.env.SITE_URL || 'https://idlemat.es';
const LOCAL_URL = 'http://localhost:3699';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Pages to audit
const PAGES_TO_AUDIT = [
  '/', 
  '/pricing', 
  '/faq', 
  '/security', 
  '/news',
  '/auth/login',
  '/auth/register',
  '/legal',
  '/legal/privacy',
  '/legal/tos'
];

// OG Images to test
const OG_ENDPOINTS_TO_TEST = [
  '/api/og',
  '/api/og?title=Test%20Page&subtitle=Test%20description',
  '/api/og?title=News%20Article&subtitle=Latest%20updates%20from%20your%20cloud%20buddy',
  '/api/og?title=Pricing&subtitle=Simple%20pricing%20for%20your%20cloud%20buddy',
  '/api/og?title=FAQ&subtitle=Get%20answers%20about%20your%20cloud%20buddy'
];

// Expected branding elements
const EXPECTED_BRANDING = [
  'cloud buddy',
  'your games never sleep',
  'we grind while you shine',
  'idle smarter, not harder',
  'lazy gamer alter-ego'
];

class SEOAuditor {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color = colors[type === 'error' ? 'red' : type === 'warning' ? 'yellow' : type === 'success' ? 'green' : 'cyan'];
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const req = client.request(url, { method: 'HEAD', ...options }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  async fetchPageContent(url) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const req = client.request(url, { method: 'GET' }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      });
      
      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  async testOGImages() {
    this.log('🖼️  Testing OG Image Generation...', 'info');
    
    for (const endpoint of OG_ENDPOINTS_TO_TEST) {
      try {
        const localUrl = `${LOCAL_URL}${endpoint}`;
        const publicUrl = `${SITE_URL}${endpoint}`;
        
        // Test local endpoint
        this.log(`Testing local: ${endpoint}`, 'info');
        const localResponse = await this.makeRequest(localUrl);
        
        if (localResponse.statusCode === 200 && localResponse.headers['content-type']?.includes('image/png')) {
          this.log(`✅ Local OG image working: ${endpoint}`, 'success');
          this.results.passed++;
        } else {
          this.log(`❌ Local OG image failed: ${endpoint} (Status: ${localResponse.statusCode})`, 'error');
          this.results.failed++;
        }
        
        // Test public endpoint
        this.log(`Testing public: ${endpoint}`, 'info');
        const publicResponse = await this.makeRequest(publicUrl);
        
        if (publicResponse.statusCode === 200 && publicResponse.headers['content-type']?.includes('image/png')) {
          this.log(`✅ Public OG image working: ${endpoint}`, 'success');
          this.results.passed++;
        } else {
          this.log(`❌ Public OG image failed: ${endpoint} (Status: ${publicResponse.statusCode})`, 'error');
          this.results.failed++;
        }
        
      } catch (error) {
        this.log(`❌ OG image error for ${endpoint}: ${error.message}`, 'error');
        this.results.failed++;
      }
    }
  }

  extractMetadataFromHTML(html) {
    const metadata = {};
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    metadata.title = titleMatch ? titleMatch[1] : null;
    
    // Extract meta tags
    const metaRegex = /<meta\s+([^>]+)>/gi;
    let match;
    
    while ((match = metaRegex.exec(html)) !== null) {
      const attributes = match[1];
      
      // Parse attributes
      const nameMatch = attributes.match(/name=["']([^"']+)["']/i);
      const propertyMatch = attributes.match(/property=["']([^"']+)["']/i);
      const contentMatch = attributes.match(/content=["']([^"']*?)["']/i);
      
      if (contentMatch) {
        const content = contentMatch[1];
        
        if (nameMatch) {
          metadata[nameMatch[1]] = content;
        } else if (propertyMatch) {
          metadata[propertyMatch[1]] = content;
        }
      }
    }
    
    return metadata;
  }

  checkBrandingInContent(content, pagePath) {
    const foundBranding = [];
    const lowerContent = content.toLowerCase();
    
    for (const brand of EXPECTED_BRANDING) {
      if (lowerContent.includes(brand.toLowerCase())) {
        foundBranding.push(brand);
      }
    }
    
    return foundBranding;
  }

  async testPageSEO(pagePath) {
    this.log(`📄 Testing page: ${pagePath}`, 'info');
    
    try {
      const url = `${SITE_URL}${pagePath}`;
      const response = await this.fetchPageContent(url);
      
      if (response.statusCode !== 200) {
        this.log(`❌ Page not accessible: ${pagePath} (Status: ${response.statusCode})`, 'error');
        this.results.failed++;
        return;
      }
      
      const metadata = this.extractMetadataFromHTML(response.body);
      const foundBranding = this.checkBrandingInContent(response.body, pagePath);
      
      let pageErrors = [];
      let pageWarnings = [];
      let pageSuccess = [];
      
      // Check required SEO elements
      if (!metadata.title || metadata.title.length < 10) {
        pageErrors.push('Missing or too short page title');
      } else {
        pageSuccess.push(`Title: ${metadata.title}`);
      }
      
      if (!metadata.description || metadata.description.length < 50) {
        pageErrors.push('Missing or too short meta description');
      } else {
        pageSuccess.push(`Description: ${metadata.description.substring(0, 100)}...`);
      }
      
      // Check OpenGraph tags
      const ogTitle = metadata['og:title'];
      const ogDescription = metadata['og:description'];
      const ogImage = metadata['og:image'];
      
      if (!ogTitle) pageErrors.push('Missing og:title');
      if (!ogDescription) pageErrors.push('Missing og:description');
      if (!ogImage) pageErrors.push('Missing og:image');
      
      if (ogImage && !ogImage.includes('/api/og')) {
        pageWarnings.push('OG image not using dynamic /api/og endpoint');
      }
      
      // Check Twitter Card tags
      const twitterCard = metadata['twitter:card'];
      const twitterTitle = metadata['twitter:title'];
      const twitterDescription = metadata['twitter:description'];
      
      if (!twitterCard) pageWarnings.push('Missing twitter:card');
      if (!twitterTitle) pageWarnings.push('Missing twitter:title');
      if (!twitterDescription) pageWarnings.push('Missing twitter:description');
      
      // Check branding
      if (foundBranding.length === 0) {
        pageWarnings.push('No "Cloud Buddy" branding found in page content');
      } else {
        pageSuccess.push(`Branding found: ${foundBranding.join(', ')}`);
      }
      
      // Check for IdleMates brand consistency
      if (metadata.title && !metadata.title.includes('IdleMates')) {
        pageWarnings.push('Page title doesn\'t include "IdleMates" brand name');
      }
      
      // Report results
      if (pageErrors.length === 0 && pageWarnings.length === 0) {
        this.log(`✅ ${pagePath} - Perfect SEO!`, 'success');
        this.results.passed++;
      } else {
        if (pageErrors.length > 0) {
          this.log(`❌ ${pagePath} - Errors: ${pageErrors.join(', ')}`, 'error');
          this.results.failed++;
        } else {
          this.log(`⚠️  ${pagePath} - Warnings: ${pageWarnings.join(', ')}`, 'warning');
          this.results.warnings++;
        }
      }
      
      pageSuccess.forEach(success => {
        this.log(`   ✓ ${success}`, 'success');
      });
      
      this.results.details.push({
        page: pagePath,
        status: response.statusCode,
        errors: pageErrors,
        warnings: pageWarnings,
        successes: pageSuccess,
        metadata,
        branding: foundBranding
      });
      
    } catch (error) {
      this.log(`❌ Error testing ${pagePath}: ${error.message}`, 'error');
      this.results.failed++;
    }
  }

  async testAllPages() {
    this.log('📊 Testing Page SEO and Metadata...', 'info');
    
    for (const page of PAGES_TO_AUDIT) {
      await this.testPageSEO(page);
    }
  }

  generateReport() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bright}${colors.blue}SEO AUDIT REPORT${colors.reset}`);
    console.log('='.repeat(80));
    console.log(`${colors.green}✅ Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.results.warnings}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${this.results.failed}${colors.reset}`);
    console.log(`${colors.cyan}📊 Total Tests: ${total}${colors.reset}`);
    
    const score = ((this.results.passed + (this.results.warnings * 0.5)) / total * 100).toFixed(1);
    console.log(`${colors.bright}🏆 SEO Score: ${score}%${colors.reset}`);
    
    if (this.results.failed > 0) {
      console.log(`\n${colors.red}${colors.bright}CRITICAL ISSUES:${colors.reset}`);
      this.results.details.forEach(detail => {
        if (detail.errors.length > 0) {
          console.log(`${colors.red}❌ ${detail.page}:${colors.reset}`);
          detail.errors.forEach(error => console.log(`   • ${error}`));
        }
      });
    }
    
    if (this.results.warnings > 0) {
      console.log(`\n${colors.yellow}${colors.bright}IMPROVEMENTS NEEDED:${colors.reset}`);
      this.results.details.forEach(detail => {
        if (detail.warnings.length > 0) {
          console.log(`${colors.yellow}⚠️  ${detail.page}:${colors.reset}`);
          detail.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
      });
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        warnings: this.results.warnings,
        failed: this.results.failed,
        total,
        score: parseFloat(score)
      },
      details: this.results.details
    };
    
    const reportPath = path.join(__dirname, '..', 'seo-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`${colors.cyan}📄 Detailed report saved to: ${reportPath}${colors.reset}`);
  }

  async run() {
    this.log('🚀 Starting IdleMates SEO Audit...', 'info');
    this.log(`🌐 Site URL: ${SITE_URL}`, 'info');
    this.log(`🏠 Local URL: ${LOCAL_URL}`, 'info');
    
    try {
      await this.testOGImages();
      await this.testAllPages();
      this.generateReport();
      
      // Exit with appropriate code
      process.exit(this.results.failed > 0 ? 1 : 0);
      
    } catch (error) {
      this.log(`💥 Audit failed: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SEOAuditor();
  auditor.run();
}

module.exports = SEOAuditor;