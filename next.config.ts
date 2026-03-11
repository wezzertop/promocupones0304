import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    // React Compiler is experimental in 15, likely default or different in 16.
    // Keeping serverActions allowedOrigins for safety.
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.1.72:3000'],
      bodySizeLimit: '5mb', // Limit body size for security
    },
    // optimizePackageImports: ['lucide-react', 'date-fns', 'framer-motion'], // Optimization
  },
  // @ts-ignore
  allowedDevOrigins: ['localhost:3000', '192.168.1.72:3000'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/avataaars/svg',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google Auth
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub Auth
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Unsplash
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com', // Amazon Images
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com', // Amazon Images (Alternative)
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com', // Mercado Libre Images
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // Imgur Images
      },
      // Note: Restricting 'hostname: "**"' is recommended for production security.
      // We kept specific providers and Supabase.
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Security headers
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ],
};

export default nextConfig;
