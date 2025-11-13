'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Download, CheckCircle, Code, Heart, Github, Gift, Zap, Shield, Globe } from 'lucide-react'
import LandingHeader from '@/components/LandingHeader'

export default function SaasLandingPage() {
  const features = [
    {
      icon: Download,
      title: '100% Gratuito',
      description: 'Descarga el código completo sin costo. Sin límites, sin restricciones. El proyecto es completamente open source.',
    },
    {
      icon: Code,
      title: 'Código Abierto',
      description: 'Código fuente completo disponible en GitHub. Modifica, personaliza y adapta a tus necesidades.',
    },
    {
      icon: Zap,
      title: 'Instalación Rápida',
      description: 'Instalador web incluido. Configura tu foro en minutos sin conocimientos técnicos avanzados.',
    },
    {
      icon: Shield,
      title: 'Control Total',
      description: 'Tus datos permanecen en tus servidores. Control completo sobre la infraestructura y configuración.',
    },
    {
      icon: Globe,
      title: 'Sin Límites',
      description: 'Sin límites de usuarios, comunidades o almacenamiento. Escala según tus necesidades.',
    },
    {
      icon: Gift,
      title: 'Actualizaciones Incluidas',
      description: 'Acceso a todas las actualizaciones y mejoras del proyecto sin costo adicional.',
    },
  ]

  const benefits = [
    'Código fuente completo disponible',
    'Licencia MIT - uso comercial permitido',
    'Instalador web incluido',
    'Documentación completa',
    'Sin dependencias de servicios externos',
    'Compatible con cualquier hosting',
  ]

  const seoContent = [
    {
      title: 'Descarga Gratuita de Plataforma de Foros',
      content: 'Descarga completamente gratis nuestra plataforma de foros open source. Código fuente completo, instalador web incluido y sin restricciones. Perfecto para comunidades, empresas y organizaciones que quieren su propio foro con control total sobre los datos y la infraestructura.',
    },
    {
      title: 'Plataforma de Foros Open Source',
      content: 'Discourse es una plataforma de foros open source bajo licencia MIT. Descarga el código, personalízalo y hostea tu propia instancia sin límites. Ideal para desarrolladores y organizaciones que necesitan control completo sobre su plataforma de comunidad.',
    },
    {
      title: 'Instalación y Configuración',
      content: 'Nuestro instalador web te guía paso a paso en la configuración de tu foro. Configura la base de datos, crea tu usuario administrador y comienza a usar tu foro en minutos. Sin necesidad de conocimientos técnicos avanzados.',
    },
    {
      title: 'Soporta el Proyecto con una Donación',
      content: 'El proyecto es completamente gratuito y open source. Si te resulta útil, considera hacer una donación para ayudar a mantener el desarrollo, mejoras y soporte de la plataforma. Cada contribución ayuda a hacer el proyecto mejor para todos.',
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
              Descarga Gratis tu{' '}
              <span className="text-primary-600">Plataforma de Foros</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Código open source completo. Descarga, instala y hostea tu propio foro 
              sin límites. 100% gratuito, sin restricciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/self-host"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                Descargar Gratis
              </Link>
              <a
                href="https://github.com/tu-usuario/discourse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
              >
                <Github className="w-5 h-5" />
                Ver en GitHub
              </a>
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
              ¿Por qué descargar nuestro código?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Plataforma completa, open source y sin restricciones
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

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Todo lo que incluye
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-lg">{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <Link
                href="/self-host"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Ver Guía de Instalación
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Heart className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              ¿Te gusta el proyecto?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              El proyecto es completamente gratuito y open source. Si te resulta útil, 
              considera hacer una donación para ayudar a mantener el desarrollo y las mejoras.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://paypal.me/tu-usuario"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Heart className="w-5 h-5" />
                Donar con PayPal
              </a>
              <a
                href="https://ko-fi.com/tu-usuario"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white rounded-lg font-semibold text-lg border-2 border-white hover:bg-white/10 transition-colors"
              >
                <Gift className="w-5 h-5" />
                Donar con Ko-fi
              </a>
            </div>
            <p className="text-primary-200 mt-6 text-sm">
              Las donaciones ayudan a mantener el proyecto activo y mejorar continuamente
            </p>
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
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Download className="w-16 h-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              ¿Listo para empezar?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Descarga el código gratis y crea tu propio foro en minutos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/self-host"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg"
              >
                <Download className="w-5 h-5" />
                Descargar Ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://github.com/tu-usuario/discourse"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
              >
                <Github className="w-5 h-5" />
                Ver Código
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
