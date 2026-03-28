import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removido output: 'export' para compatibilidad con Server Actions
  // 2. DESHABILITAR OPTIMIZACIÓN DE IMÁGENES POR SERVIDOR
  // Las APKs no pueden procesar imágenes en tiempo de ejecución de servidor.
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 3. MANTENER TUS CONFIGURACIONES ACTUALES
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  // Nota: Los 'headers' de seguridad y redirecciones de Next.js NO funcionan 
  // en exportación estática (output: 'export') porque dependen de un servidor Vercel/Node.
  // Sin embargo, puedes dejarlos si planeas seguir desplegando en web también.
};

export default nextConfig;