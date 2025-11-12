'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, RotateCw } from 'lucide-react'

interface ImageCropperProps {
  imageSrc: string
  aspectRatio: number // width/height
  targetWidth: number
  targetHeight: number
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
  type: 'avatar' | 'banner'
}

export default function ImageCropper({
  imageSrc,
  aspectRatio,
  targetWidth,
  targetHeight,
  onCropComplete,
  onCancel,
  type,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageLoaded(true)
    
    if (containerRef.current && img) {
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight
      const imgAspect = img.naturalWidth / img.naturalHeight
      const cropAspect = type === 'avatar' ? 1 : aspectRatio
      
      let initialZoom = 1
      if (imgAspect > cropAspect) {
        initialZoom = (containerHeight * 1.2) / (img.naturalHeight * (containerWidth / containerHeight))
      } else {
        initialZoom = (containerWidth * 1.2) / (img.naturalWidth * (containerHeight / containerWidth))
      }
      
      setZoom(Math.max(1, initialZoom))
    }
  }, [aspectRatio, type])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y })
  }, [crop])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Limitar el movimiento dentro del contenedor
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const maxX = containerRect.width / 2
    const maxY = containerRect.height / 2
    
    setCrop({
      x: Math.max(-maxX, Math.min(maxX, newX)),
      y: Math.max(-maxY, Math.min(maxY, newY)),
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !containerRef.current) return

    setIsProcessing(true)

    try {
      const img = imageRef.current
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const imgRect = img.getBoundingClientRect()

      // Calcular escalas
      const scaleX = img.naturalWidth / imgRect.width
      const scaleY = img.naturalHeight / imgRect.height

      // Calcular el centro del área de recorte en coordenadas de la imagen original
      const cropCenterX = (containerRect.left + containerRect.width / 2 - imgRect.left) * scaleX
      const cropCenterY = (containerRect.top + containerRect.height / 2 - imgRect.top) * scaleY
      
      // Calcular dimensiones del crop en la imagen original (ajustadas por zoom)
      const cropAreaWidth = (containerRect.width / zoom) * scaleX
      const cropAreaHeight = (containerRect.height / zoom) * scaleY
      
      // Asegurar que el crop respete el aspect ratio del target
      const targetAspect = targetWidth / targetHeight
      let finalCropWidth = cropAreaWidth
      let finalCropHeight = cropAreaHeight
      
      // Ajustar para mantener aspect ratio y usar cover (llenar sin franjas)
      const cropAspect = finalCropWidth / finalCropHeight
      if (cropAspect > targetAspect) {
        // Crop más ancho que el target - aumentar altura
        finalCropHeight = finalCropWidth / targetAspect
      } else {
        // Crop más alto que el target - aumentar ancho
        finalCropWidth = finalCropHeight * targetAspect
      }
      
      let finalCropX = cropCenterX - finalCropWidth / 2
      let finalCropY = cropCenterY - finalCropHeight / 2
      
      // Asegurar que no salga de los límites de la imagen
      finalCropX = Math.max(0, Math.min(finalCropX, img.naturalWidth - finalCropWidth))
      finalCropY = Math.max(0, Math.min(finalCropY, img.naturalHeight - finalCropHeight))
      
      // Si el crop es más grande que la imagen, ajustar
      if (finalCropWidth > img.naturalWidth) {
        finalCropWidth = img.naturalWidth
        finalCropHeight = finalCropWidth / targetAspect
        finalCropX = 0
        finalCropY = Math.max(0, Math.min(finalCropY, img.naturalHeight - finalCropHeight))
      }
      if (finalCropHeight > img.naturalHeight) {
        finalCropHeight = img.naturalHeight
        finalCropWidth = finalCropHeight * targetAspect
        finalCropY = 0
        finalCropX = Math.max(0, Math.min(finalCropX, img.naturalWidth - finalCropWidth))
      }

      // Crear canvas para recortar
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No se pudo crear el contexto del canvas')
      }

      // Para avatar, hacer el recorte circular ANTES de dibujar
      if (type === 'avatar') {
        ctx.beginPath()
        ctx.arc(targetWidth / 2, targetHeight / 2, Math.min(targetWidth, targetHeight) / 2, 0, 2 * Math.PI)
        ctx.clip()
      }

      // Aplicar rotación si es necesario (después del clip para avatar)
      if (rotation !== 0) {
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-canvas.width / 2, -canvas.height / 2)
      }

      // Dibujar la imagen recortada con cover para evitar franjas negras
      ctx.drawImage(
        img,
        finalCropX,
        finalCropY,
        finalCropWidth,
        finalCropHeight,
        0,
        0,
        targetWidth,
        targetHeight
      )

      if (rotation !== 0) {
        ctx.restore()
      }

      const quality = type === 'avatar' ? 0.9 : 0.85
      const optimizedBase64 = canvas.toDataURL('image/jpeg', quality)

      if (optimizedBase64.length > 500 * 1024) {
        const lowerQualityBase64 = canvas.toDataURL('image/jpeg', type === 'avatar' ? 0.8 : 0.75)
        onCropComplete(lowerQualityBase64)
      } else {
        onCropComplete(optimizedBase64)
      }
    } catch (error) {
      alert('Error al procesar la imagen. Por favor, intenta de nuevo.')
    } finally {
      setIsProcessing(false)
    }
  }, [crop, zoom, rotation, targetWidth, targetHeight, type, onCropComplete])

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {type === 'avatar' ? 'Recortar imagen de comunidad' : 'Recortar banner'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Dimensiones recomendadas: {targetWidth} × {targetHeight} píxeles
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isProcessing}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Área de recorte */}
          <div className="flex-1 overflow-auto p-6">
            <div
              ref={containerRef}
              className="relative mx-auto bg-gray-100 rounded-lg overflow-hidden cursor-move"
              style={{
                width: '100%',
                maxWidth: '600px',
                aspectRatio: type === 'avatar' ? 1 : aspectRatio,
                borderRadius: type === 'avatar' ? '50%' : '0.5rem',
                minHeight: type === 'avatar' ? '300px' : '200px',
              }}
              onMouseDown={handleMouseDown}
            >
              {imageLoaded && (
                <div
                  className={`absolute inset-0 border-2 border-primary-500 border-dashed pointer-events-none z-10 ${
                    type === 'avatar' ? 'rounded-full' : ''
                  }`}
                  style={{
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  }}
                />
              )}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Preview"
                className={`absolute inset-0 w-full h-full select-none ${
                  type === 'avatar' ? 'object-cover rounded-full' : 'object-cover'
                }`}
                style={{
                  transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.1s',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onLoad={handleImageLoad}
                draggable={false}
              />
            </div>

            {/* Controles */}
            <div className="mt-6 space-y-4 max-w-600px mx-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zoom: {Math.round(zoom * 100)}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rotación: {rotation}°
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    onClick={() => setRotation(0)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Resetear rotación"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Instrucciones de arrastre */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 Instrucciones:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Arrastra la imagen para posicionarla</li>
                  <li>Usa el zoom para acercar o alejar</li>
                  <li>Ajusta la rotación si es necesario</li>
                  <li>El área resaltada será el resultado final</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button
              onClick={handleCrop}
              disabled={isProcessing || !imageLoaded}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Aplicar recorte
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
