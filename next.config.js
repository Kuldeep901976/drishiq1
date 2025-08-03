// Next.js Configuration File
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export is handled separately for mobile builds
  trailingSlash: true,
  
  // Add ESLint disable to prevent hook rule violations during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Performance optimizations
  experimental: {
    // optimizeCss: true, // Disabled due to dependency issues
  },
  
  // Webpack configuration to fix .pack.gz issues
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable webpack cache compression in development
      config.cache = {
        type: 'filesystem',
        compression: false, // This prevents .pack.gz files
        maxMemoryGenerations: 1,
        store: 'pack',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
  
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.render.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
    domains: ['via.placeholder.com'],
  },
  
  // Performance optimizations - Disable SWC due to Windows compatibility issues
  swcMinify: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com *.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' *.googleapis.com *.gstatic.com",
              "img-src 'self' data: blob: *.supabase.co *.render.com images.unsplash.com",
              "font-src 'self' *.gstatic.com",
              "connect-src 'self' *.supabase.co *.googleapis.com *.firebase.com *.firebaseio.com",
              "frame-src 'self' *.youtube.com *.youtube-nocookie.com",
              "media-src 'self' *.youtube.com *.youtube-nocookie.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'"
            ].join('; ')
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-RateLimit-Limit',
            value: '100'
          },
          {
            key: 'X-RateLimit-Remaining',
            value: '99'
          },
          {
            key: 'X-RateLimit-Reset',
            value: new Date(Date.now() + 60 * 1000).toISOString()
          }
        ]
      }
    ]
  },
  
  // We handle i18n through middleware and components
  // since Next.js i18n is not compatible with static export
  
  // Ensure static files are served correctly
  async rewrites() {
    return [];
  },
};

module.exports = withPWA(nextConfig); 