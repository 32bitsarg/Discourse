'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, FileText, Lock } from 'lucide-react'
import { useState } from 'react'

interface CreateSubforumModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; isPublic: boolean; requiresApproval: boolean }) => void
}

export default function CreateSubforumModal({ isOpen, onClose, onSubmit }: CreateSubforumModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [requiresApproval, setRequiresApproval] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit({ 
        name: name.trim(), 
        description: description.trim(), 
        isPublic,
        requiresApproval: !isPublic || requiresApproval // Si es privada, siempre requiere aprobación
      })
      setName('')
      setDescription('')
      setIsPublic(true)
      setRequiresApproval(false)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Comunidad</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de la comunidad
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="r/nombre-comunidad"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      maxLength={50}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    El nombre debe ser único y solo puede contener letras, números y guiones
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe tu comunidad..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      maxLength={200}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {description.length}/200 caracteres
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => {
                        setIsPublic(e.target.checked)
                        if (e.target.checked) {
                          setRequiresApproval(false) // Si es pública, resetear requiresApproval
                        }
                      }}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="flex items-center gap-2">
                      {isPublic ? (
                        <Hash className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        Comunidad pública
                      </span>
                    </div>
                  </label>
                  
                  {isPublic && (
                    <label className="flex items-center gap-3 cursor-pointer ml-8">
                      <input
                        type="checkbox"
                        checked={requiresApproval}
                        onChange={(e) => setRequiresApproval(e.target.checked)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-600">
                        Requiere aprobación para unirse (incluso siendo pública)
                      </span>
                    </label>
                  )}
                  
                  {!isPublic && (
                    <div className="ml-8 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Comunidad privada: Los usuarios necesitarán aprobación para unirse
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Crear Comunidad
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

