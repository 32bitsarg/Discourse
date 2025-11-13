'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Zap, Users, Database, Globe, Code, Headphones } from 'lucide-react'
import Link from 'next/link'

interface Plan {
  name: string
  displayName: string
  description: string
  priceMonthly: number
  priceYearly: number
  features: string[]
  popular?: boolean
  icon: any
}

const plans: Plan[] = [
  {
    name: 'free',
    displayName: 'Free',
    description: 'Perfecto para empezar y probar la plataforma',
    priceMonthly: 0,
    priceYearly: 0,
    icon: Zap,
    features: [
      'Hasta 100 usuarios',
      'Hasta 10 comunidades',
      '1GB de almacenamiento',
      'Soporte por email',
      'Subdominio incluido',
    ],
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'Para comunidades en crecimiento',
    priceMonthly: 29.99,
    priceYearly: 299.99,
    icon: Users,
    popular: true,
    features: [
      'Hasta 1,000 usuarios',
      'Hasta 100 comunidades',
      '50GB de almacenamiento',
      'Dominio personalizado',
      'API access',
      'Soporte prioritario',
      'Analytics avanzados',
    ],
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Para organizaciones grandes',
    priceMonthly: 199.99,
    priceYearly: 1999.99,
    icon: Database,
    features: [
      'Usuarios ilimitados',
      'Comunidades ilimitadas',
      '500GB de almacenamiento',
      'Dominio personalizado',
      'API access completo',
      'Soporte 24/7',
      'SLA garantizado',
      'Migración asistida',
    ],
  },
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Elige el plan perfecto para tu comunidad
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Desde comunidades pequeñas hasta organizaciones grandes.
            Todos los planes incluyen 14 días de prueba gratuita.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-2 text-sm text-green-600">Ahorra 17%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly
            const monthlyEquivalent = billingCycle === 'yearly' ? price / 12 : price

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.popular ? 'ring-2 ring-indigo-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.displayName}
                  </h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      ${Math.round(monthlyEquivalent)}
                    </span>
                    <span className="text-gray-600 ml-2">/mes</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Facturado anualmente (${price}/año)
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/register?plan=${plan.name}`}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-all ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                      : plan.name === 'free'
                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  {plan.name === 'free' ? 'Empezar Gratis' : 'Comenzar Prueba'}
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Preguntas Frecuentes
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Puedo cambiar de plan más tarde?
              </h3>
              <p className="text-gray-600">
                Sí, puedes actualizar o degradar tu plan en cualquier momento.
                Los cambios se aplicarán en el próximo ciclo de facturación.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Qué pasa si excedo los límites de mi plan?
              </h3>
              <p className="text-gray-600">
                Te notificaremos cuando te acerques a los límites. Puedes
                actualizar tu plan o contactarnos para soluciones personalizadas.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Puedo hostear mi propia instancia?
              </h3>
              <p className="text-gray-600">
                Sí, ofrecemos la opción de self-hosting. Puedes descargar el
                código fuente y hostear tu propia instancia. Consulta nuestra{' '}
                <Link href="/self-host" className="text-indigo-600 hover:underline">
                  documentación de self-hosting
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            ¿Tienes preguntas? Contáctanos en{' '}
            <a href="mailto:support@discourse.com" className="text-indigo-600 hover:underline">
              support@discourse.com
            </a>
          </p>
          <Link
            href="/self-host"
            className="inline-block text-indigo-600 hover:text-indigo-700 font-medium"
          >
            O descarga y hostea tu propia instancia →
          </Link>
        </div>
      </div>
    </div>
  )
}

