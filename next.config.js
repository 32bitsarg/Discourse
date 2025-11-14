// Solo aplicar PWA si no estamos en Vercel (para evitar conflictos con Turbopack)
const isVercel = process.env.VERCEL === '1'

const withPWA = isVercel 
  ? (config) => config // No aplicar PWA en Vercel
  : require('next-pwa')({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: process.env.NODE_ENV === 'development',
      buildExcludes: [/middleware-manifest.json$/],
      runtimeCaching: [
        {
          urlPattern: /^https?.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'offlineCache',
            expiration: {
              maxEntries: 200,
            },
          },
        },
      ],
    })

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimizaciones de compresión
  compress: true,
  // Configuración de Turbopack (vacía para compatibilidad con next-pwa)
  turbopack: {},
  // Configuración de imágenes (para futura migración a next/image)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Headers de seguridad y optimización
  async headers() {
    return [
      {
        source: '/api/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // Configuración para Capacitor (cuando se use)
  // output: 'export', // Descomentar cuando quieras generar build estático para Capacitor
}

module.exports = withPWA(nextConfig)

