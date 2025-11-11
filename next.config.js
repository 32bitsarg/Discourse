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
  // Configuración para Capacitor (cuando se use)
  // output: 'export', // Descomentar cuando quieras generar build estático para Capacitor
  // images: {
  //   unoptimized: true, // Necesario para export estático
  // },
}

module.exports = withPWA(nextConfig)

