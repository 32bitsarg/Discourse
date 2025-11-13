'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Users, MessageSquare, TrendingUp, Shield, Zap, Globe, Heart, CheckCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import LandingHeader from '@/components/LandingHeader'

export default function LandingPage() {
  const { t } = useI18n()

  const features = [
    {
      icon: Users,
      title: 'Comunidades Personalizadas',
      description: 'Crea y gestiona tu propia comunidad virtual. Construye un espacio donde tus usuarios puedan debatir, compartir y colaborar.',
    },
    {
      icon: MessageSquare,
      title: 'Foro Interactivo',
      description: 'Plataforma de debate online diseñada para fomentar el engagement y la participación activa de los miembros.',
    },
    {
      icon: TrendingUp,
      title: 'Contenido Relevante',
      description: 'Algoritmo inteligente que muestra el contenido más relevante para ti, mejorando tu experiencia de comunidad.',
    },
    {
      icon: Shield,
      title: 'Gestión de Comunidades',
      description: 'Herramientas completas para moderar, gestionar y hacer crecer tu comunidad de marca o grupo de usuarios.',
    },
    {
      icon: Zap,
      title: 'Rápido y Moderno',
      description: 'Interfaz moderna y rápida. Una alternativa a Reddit con mejor experiencia de usuario y diseño actualizado.',
    },
    {
      icon: Heart,
      title: 'Community Engagement',
      description: 'Fomenta la participación y el engagement de tu comunidad con herramientas diseñadas para la interacción.',
    },
  ]

  const benefits = [
    'Alternativa a Reddit en español',
    'Plataforma colaborativa gratuita',
    'Crea comunidades públicas o privadas',
    'Sistema de votación y comentarios',
    'Perfiles enriquecidos y seguimiento',
    'Feed personalizado con algoritmo propio',
  ]

  const seoContent = [
    {
      title: 'Reddit Español - La Mejor Alternativa',
      content: 'Discourse es la mejor alternativa a Reddit en español. Una plataforma colaborativa donde puedes crear comunidades virtuales, foros de discusión y espacios de debate online. Perfecta para construir comunidades, gestionar foros y fomentar el engagement.',
    },
    {
      title: 'Cómo Crear una Comunidad Virtual',
      content: 'Aprende a construir tu propia comunidad virtual con Discourse. Nuestra plataforma te ofrece todas las herramientas necesarias para crear foros comunitarios, gestionar comunidades de marca y fomentar el debate online. Ideal para community engagement y branded communities.',
    },
    {
      title: 'Foro de Discusión y Debate Online',
      content: 'Participa en foros interactivos y debates online. Discourse es una red social alternativa diseñada para la colaboración, donde puedes crear comunidades de usuarios, compartir ideas y construir engagement comunitario.',
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
              La Mejor{' '}
              <span className="text-primary-600">Alternativa a Reddit</span>{' '}
              en Español
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Construye y gestiona tu comunidad virtual. Plataforma colaborativa para crear foros de discusión, 
              comunidades de usuarios y espacios de debate online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Explorar Comunidades
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/forums"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
              >
                Ver Foros
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
              ¿Por qué elegir Discourse?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              La plataforma perfecta para crear comunidades, gestionar foros y construir engagement
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Crea tu Comunidad Virtual
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Discourse es la mejor alternativa a Reddit en español. Una plataforma colaborativa 
                donde puedes crear foros de discusión, comunidades de usuarios y espacios de debate online.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                ¿Listo para empezar?
              </h3>
              <p className="text-gray-600 mb-6">
                Únete a nuestra comunidad y descubre cómo crear y gestionar tu propia comunidad virtual.
              </p>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors w-full justify-center"
              >
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas saber sobre Discourse
            </h2>
          </motion.div>

          <div className="space-y-8">
            {seoContent.map((item, index) => (
              <motion.article
                key={index}
                className="bg-gray-50 rounded-xl p-6 sm:p-8"
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

      {/* SaaS Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                ¿Quieres tu Propio Foro?
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Crea tu propio foro en minutos con nuestra plataforma SaaS. 
                Hosting gestionado, sin configuración técnica, o descarga el código 
                y hostea tu propia instancia con control total.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/saas"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Crear Mi Foro
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/self-host"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  Self-Hosting
                </Link>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Opciones Disponibles
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">SaaS:</strong>
                    <span className="text-gray-600 ml-2">Hosting gestionado, configuración en minutos</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Self-Hosting:</strong>
                    <span className="text-gray-600 ml-2">Control total, código open source</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Planes desde Gratis:</strong>
                    <span className="text-gray-600 ml-2">Empieza gratis y escala según crezcas</span>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Construye tu Comunidad Hoy
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              La plataforma colaborativa perfecta para crear foros de discusión, 
              gestionar comunidades de marca y fomentar el engagement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Explorar Discourse
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/saas"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white rounded-lg font-semibold text-lg border-2 border-white hover:bg-white/10 transition-colors"
              >
                Crear Mi Foro
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
