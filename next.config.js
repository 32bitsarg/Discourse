const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
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

