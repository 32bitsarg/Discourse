'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import CreatePostBox from '../CreatePostBox'

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)

  useEffect(() => {
    // Verificar usuario
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})

    // Escuchar evento para abrir desde bottom nav
    const handleOpenCreatePost = () => {
      if (user) {
        setIsOpen(true)
      }
    }

    window.addEventListener('openCreatePost', handleOpenCreatePost as EventListener)

    return () => {
      window.removeEventListener('openCreatePost', handleOpenCreatePost as EventListener)
    }
  }, [user])

  if (!user) {
    return null
  }

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 shadow-lg flex items-center justify-center text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Modal Full Screen */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              className="fixed inset-0 z-50 bg-white flex flex-col"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 safe-area-top">
                <h2 className="text-lg font-bold text-gray-900">Crear Publicación</h2>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <CreatePostBox
                  onPostCreated={() => {
                    setIsOpen(false)
                    // Recargar página o actualizar feed
                    window.location.reload()
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

