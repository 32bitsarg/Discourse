'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Cloud, Download, CheckCircle, Zap, Users, Database, Globe, Code, Shield, Rocket, TrendingUp } from 'lucide-react'
import LandingHeader from '@/components/LandingHeader'

export default function SaasLandingPage() {
  const features = [
    {
      icon: Cloud,
      title: 'Hosting Gestionado',
      description: 'No te preocupes por servidores, actualizaciones o mantenimiento. Nosotros nos encargamos de todo.',
    },
    {
      icon: Zap,
      title: 'Configuración en Minutos',
      description: 'Crea tu foro en menos de 5 minutos. Sin configuración técnica, sin complicaciones.',
    },
    {
      icon: Shield,
      title: 'Seguridad y Backup',
      description: 'Tus datos están seguros con backups automáticos y protección contra ataques.',
    },
    {
      icon: TrendingUp,
      title: 'Escalabilidad Automática',
      description: 'Tu foro crece sin límites. Nosotros manejamos el tráfico y la infraestructura.',
    },
    {
      icon: Globe,
      title: 'Dominio Personalizado',
      description: 'Usa tu propio dominio (planes Pro+). Tu marca, tu identidad.',
    },
    {
      icon: Database,
      title: 'Base de Datos Dedicada',
      description: 'Cada foro tiene su propia base de datos. Aislamiento total de datos.',
    },
  ]

  const saasBenefits = [
    'Sin conocimientos técnicos necesarios',
    'Actualizaciones automáticas',
    'Soporte técnico incluido',
    'SSL/HTTPS automático',
    'CDN global para velocidad',
    'Monitoreo 24/7',
  ]

  const selfHostBenefits = [
    'Control total sobre tus datos',
    'Sin límites de usuarios o comunidades',
    'Personalización completa del código',
    'Sin costos de hosting mensuales',
    'Puedes modificar todo lo que quieras',
    'Código open source (MIT)',
  ]

  const seoContent = [
    {
      title: 'Crea tu Propio Foro - Plataforma SaaS de Foros',
      content: 'Crea tu propio foro en minutos con nuestra plataforma SaaS. Hosting gestionado, configuración automática y sin necesidad de conocimientos técnicos. Perfecto para comunidades, empresas y organizaciones que quieren su propio espacio de discusión sin complicaciones.',
    },
    {
      title: 'Plataforma de Foros como Servicio (SaaS)',
      content: 'Discourse ofrece una solución SaaS completa para crear y gestionar foros. Con planes desde gratis hasta enterprise, puedes crear tu comunidad virtual con subdominio personalizado, base de datos dedicada y todas las herramientas de moderación que necesitas.',
    },
    {
      title: 'Self-Hosting: Hostea tu Propio Foro',
      content: '¿Prefieres control total? Descarga el código fuente y hostea tu propia instancia. Código open source bajo licencia MIT, instalador incluido y documentación completa. Perfecto para desarrolladores y organizaciones que necesitan control completo sobre su infraestructura.',
    },
    {
      title: 'Comparación: SaaS vs Self-Hosting',
      content: 'SaaS: Ideal para quienes quieren empezar rápido sin preocuparse por servidores. Self-Hosting: Perfecto para quienes necesitan control total, personalización avanzada o tienen requisitos específicos de seguridad y privacidad.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-32">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Crea tu Propio{' '}
              <span className="text-primary-600">Foro en Minutos</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Plataforma SaaS para crear foros y comunidades. Hosting gestionado, 
              configuración automática y sin complicaciones técnicas. O descarga el código 
              y hostea tu propia instancia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Crear Mi Foro Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/self-host"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Download className="w-5 h-5" />
                Descargar Código
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir nuestra plataforma?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              SaaS gestionado o self-hosting, tú decides
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              SaaS vs Self-Hosting
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Elige la opción que mejor se adapte a tus necesidades
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SaaS Column */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  SaaS (Hosting Gestionado)
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Perfecto para quienes quieren empezar rápido sin preocuparse por la infraestructura.
              </p>
              <ul className="space-y-3 mb-8">
                {saasBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors w-full justify-center"
              >
                Crear Foro SaaS
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Self-Host Column */}
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Self-Hosting
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Ideal para desarrolladores y organizaciones que necesitan control total.
              </p>
              <ul className="space-y-3 mb-8">
                {selfHostBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/self-host"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full justify-center"
              >
                <Download className="w-5 h-5" />
                Descargar Código
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Planes desde Gratis
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Empieza gratis y escala según crezca tu comunidad
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg"
            >
              Ver Planes y Precios
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Todo sobre nuestra Plataforma de Foros
            </h2>
          </motion.div>

          <div className="space-y-8">
            {seoContent.map((item, index) => (
              <motion.article
                key={index}
                className="bg-white rounded-xl p-6 sm:p-8 shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.content}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Rocket className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              ¿Listo para crear tu foro?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Empieza gratis hoy mismo o descarga el código para hostear tu propia instancia
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Crear Foro Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/self-host"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white rounded-lg font-semibold text-lg border-2 border-white hover:bg-white/10 transition-colors"
              >
                <Download className="w-5 h-5" />
                Self-Hosting
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

