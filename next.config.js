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
  }
}

module.exports = nextConfig
