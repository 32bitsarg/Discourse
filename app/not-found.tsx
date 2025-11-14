'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function NotFound() {
  // Try to use i18n, but fallback to English if not available
  let t: any
  try {
    const i18n = useI18n()
    t = i18n.t
  } catch {
    // Fallback translations if I18nProvider is not available
    t = {
      common: {
        error: 'Error',
      },
      community: {
        backToHome: 'Back to home',
      },
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t?.community?.backToHome || 'Go Home'}
        </Link>
      </div>
    </div>
  )
}

