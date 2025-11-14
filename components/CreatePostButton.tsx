'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, Edit3 } from 'lucide-react'
import CreatePostModal from './CreatePostModal'
import { useUser } from '@/lib/hooks/useUser'

export default function CreatePostButton() {
  // OPTIMIZACIÓN: Usar SWR para obtener usuario
  const { user } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    if (!user) {
      alert('Debes iniciar sesión para crear una publicación')
      return
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: { title: string; content: string; subforumId: number }) => {
    const res = await fetch('/api/posts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Error al crear el post')
    }

    // Recargar la página para ver el nuevo post
    window.location.reload()
  }

  return (
    <>
      <motion.button
        onClick={handleClick}
        className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 hover:border-primary-500 shadow-sm transition-colors group"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-gray-500 text-sm group-hover:text-gray-700 transition-colors">
            Crear publicación
          </div>
          <div className="text-gray-900 font-semibold text-sm">
            Comparte algo con la comunidad
          </div>
        </div>
        <Edit3 className="w-5 h-5 text-gray-500 group-hover:text-primary-600 transition-colors" />
      </motion.button>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  )
}

