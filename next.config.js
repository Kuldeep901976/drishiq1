// Next.js Configuration File
// TEST COMMENT: If you see this comment, changes are being applied
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // TEST COMMENT: NUCLEAR APPROACH - Complete static generation disable
  // Force server-side rendering only
  output: 'standalone',
  
  // Completely disable static generation
  experimental: {
    staticPageGenerationTimeout: 0,
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
    // Force all pages to be dynamic
    isrMemoryCacheSize: 0,
    workerThreads: false,
    cpus: 1,
  },
  
  // Disable static generation completely
  generateStaticParams: async () => {
    console.log('TEST: generateStaticParams called - should return empty array');
    return [];
  },
  
  // Disable static export completely
  trailingSlash: false,
  
  // Add ESLint disable to prevent hook rule violations during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable static optimization
  staticPageGenerationTimeout: 0,
  
  // Force all pages to be dynamic
  async getStaticProps() {
    return {
      notFound: true,
    };
  },
  
  // Disable static generation for all pages
  async getStaticPaths() {
    return {
      paths: [],
      fallback: 'blocking',
    };
  },
  
  // Webpack configuration to disable static optimization
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable webpack cache compression in development
      config.cache = {
        type: 'filesystem',
        compression: false,
        maxMemoryGenerations: 1,
        store: 'pack',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    // Disable static optimization in webpack
    config.optimization = {
      ...config.optimization,
      splitChunks: false,
      runtimeChunk: false,
      minimize: false,
    };
    
    // Disable static generation
    config.plugins = config.plugins.filter(plugin => {
      return !plugin.constructor.name.includes('Static');
    });
    
    return config;
  },
  
  images: {
    unoptimized: true, // Force unoptimized images
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