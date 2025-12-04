/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  compress: true,
  
  // Faster dev compilation
  experimental: {
    optimizePackageImports: ['@dnd-kit/core'],
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Ensure static assets load correctly behind proxies (GitHub Codespaces/App.dev)
  // Set assetPrefix from environment when deployed behind a proxy domain
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || undefined
}

module.exports = nextConfig
