'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function MobileHeader() {
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
              <span className="text-lg font-black bg-gradient-to-r from-primary-600 via-purple-600 to-primary-500 bg-clip-text text-transparent">
                Discourse
              </span>
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  )
}

