'use client'

import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <footer className="mt-12 py-8 px-4 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">© {new Date().getFullYear()} Discourse</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
