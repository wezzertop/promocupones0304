import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.1.72:3000'],
    },
  },
  // @ts-ignore
  allowedDevOrigins: ['localhost:3000', '192.168.1.72:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/avataaars/svg',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all domains for demo purposes, restrict in production
      },
    ],
  },
};

export default nextConfig;
