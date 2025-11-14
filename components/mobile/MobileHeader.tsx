'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import SiteNameClient from '../SiteNameClient'
import { useSettings } from '@/lib/hooks/useSettings'

export default function MobileHeader() {
  const { settings } = useSettings()
  
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 safe-area-top lg:hidden">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center h-14 px-4">
          {/* Logo - Centrado */}
          <Link href="/feed">
            <motion.div
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {settings.siteLogo && (
                <img 
                  src={settings.siteLogo} 
                  alt="Logo" 
                  className="h-6 w-auto object-contain mr-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <span className="text-lg font-black">
                <SiteNameClient />
              </span>
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  )
}

