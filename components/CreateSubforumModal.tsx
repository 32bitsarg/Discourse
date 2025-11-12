'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, FileText, Lock, Image, Upload } from 'lucide-react'
import { useState, useRef } from 'react'
import { useI18n } from '@/lib/i18n/context'
import ImageCropper from './ImageCropper'

interface CreateSubforumModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description: string; isPublic: boolean; requiresApproval: boolean; image_url?: string; banner_url?: string }) => void
}

export default function CreateSubforumModal({ isOpen, onClose, onSubmit }: CreateSubforumModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [showBannerCropper, setShowBannerCropper] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string>('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Dimensiones recomendadas
  const AVATAR_WIDTH = 256
  const AVATAR_HEIGHT = 256
  const BANNER_WIDTH = 1920
  const BANNER_HEIGHT = 400

  const handleImageUpload = () => {
    imageInputRef.current?.click()
  }

  const handleBannerUpload = () => {
    bannerInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. El tamaño máximo es 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setTempImageSrc(base64)
        setShowImageCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El banner es demasiado grande. El tamaño máximo es 5MB.')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setTempImageSrc(base64)
        setShowBannerCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageCropComplete = (croppedImage: string) => {
    setImageUrl(croppedImage)
    setImagePreview(croppedImage)
    setShowImageCropper(false)
    setTempImageSrc('')
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleBannerCropComplete = (croppedImage: string) => {
    setBannerUrl(croppedImage)
    setBannerPreview(croppedImage)
    setShowBannerCropper(false)
    setTempImageSrc('')
    if (bannerInputRef.current) {
      bannerInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit({ 
        name: name.trim(), 
        description: description.trim(), 
        isPublic,
        requiresApproval: !isPublic || requiresApproval, // Si es privada, siempre requiere aprobación
        image_url: imageUrl || undefined,
        banner_url: bannerUrl || undefined,
      })
      setName('')
      setDescription('')
      setIsPublic(true)
      setRequiresApproval(false)
      setImageUrl('')
      setBannerUrl('')
      setImagePreview(null)
      setBannerPreview(null)
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
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900">{t.community.createCommunity}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.community.name}
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
                    {t.community.uniqueName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.community.description}
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t.community.description}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      maxLength={200}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {description.length}/200 {t.common.characters}
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
                        {t.community.public}
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
                        {t.community.requiresApproval}
                      </span>
                    </label>
                  )}
                  
                  {!isPublic && (
                    <div className="ml-8 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t.community.privateDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Imagen y Banner en grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Imagen de la comunidad */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Imagen (opcional)
                    </label>
                    <div className="space-y-2">
                      {imagePreview ? (
                        <div className="relative inline-block">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null)
                              setImageUrl('')
                              if (imageInputRef.current) {
                                imageInputRef.current.value = ''
                              }
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {imagePreview ? 'Cambiar' : 'Subir'}
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <p className="text-xs text-blue-600 font-medium">
                        📐 {AVATAR_WIDTH}×{AVATAR_HEIGHT}px
                      </p>
                    </div>
                  </div>

                  {/* Banner de la comunidad */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Banner (opcional)
                    </label>
                    <div className="space-y-2">
                      {bannerPreview ? (
                        <div className="relative inline-block">
                          <img
                            src={bannerPreview}
                            alt="Preview"
                            className="w-full h-20 rounded-lg object-cover border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBannerPreview(null)
                              setBannerUrl('')
                              if (bannerInputRef.current) {
                                bannerInputRef.current.value = ''
                              }
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleBannerUpload}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {bannerPreview ? 'Cambiar' : 'Subir'}
                      </button>
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                      <p className="text-xs text-blue-600 font-medium">
                        📐 {BANNER_WIDTH}×{BANNER_HEIGHT}px
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                  <p className="font-semibold mb-1">💡 Nota:</p>
                  <p>Las imágenes serán recortadas y optimizadas automáticamente al tamaño recomendado.</p>
                </div>

                <div className="flex gap-3 pt-4 border-t flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    {t.community.createCommunity}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}

      {/* Image Cropper para Avatar */}
      {showImageCropper && tempImageSrc && (
        <ImageCropper
          imageSrc={tempImageSrc}
          aspectRatio={1}
          targetWidth={AVATAR_WIDTH}
          targetHeight={AVATAR_HEIGHT}
          onCropComplete={handleImageCropComplete}
          onCancel={() => {
            setShowImageCropper(false)
            setTempImageSrc('')
            if (imageInputRef.current) {
              imageInputRef.current.value = ''
            }
          }}
          type="avatar"
        />
      )}

      {/* Image Cropper para Banner */}
      {showBannerCropper && tempImageSrc && (
        <ImageCropper
          imageSrc={tempImageSrc}
          aspectRatio={BANNER_WIDTH / BANNER_HEIGHT}
          targetWidth={BANNER_WIDTH}
          targetHeight={BANNER_HEIGHT}
          onCropComplete={handleBannerCropComplete}
          onCancel={() => {
            setShowBannerCropper(false)
            setTempImageSrc('')
            if (bannerInputRef.current) {
              bannerInputRef.current.value = ''
            }
          }}
          type="banner"
        />
      )}
    </AnimatePresence>
  )
}

