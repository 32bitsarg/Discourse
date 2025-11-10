'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image, 
  Video,
  Code,
  Quote
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Escribe tu publicación aquí...',
  rows = 8 
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Restaurar selección
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      )
    }, 0)
  }

  const handleImageUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsUploading(true)
      try {
        // Por ahora, convertir a base64 (en producción usarías un servicio de upload)
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          const imgTag = `\n![${file.name}](${base64})\n`
          insertText(imgTag)
          setIsUploading(false)
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error uploading image:', error)
        setIsUploading(false)
      }
    }
    input.click()
  }

  const handleVideoUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsUploading(true)
      try {
        // Por ahora, convertir a base64 (en producción usarías un servicio de upload)
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          const videoTag = `\n<video src="${base64}" controls></video>\n`
          insertText(videoTag)
          setIsUploading(false)
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('Error uploading video:', error)
        setIsUploading(false)
      }
    }
    input.click()
  }

  const handleImageUrl = () => {
    const url = prompt('Ingresa la URL de la imagen:')
    if (url) {
      insertText(`\n![Imagen](${url})\n`)
    }
  }

  const handleVideoUrl = () => {
    const url = prompt('Ingresa la URL del video (YouTube, Vimeo, etc.):')
    if (url) {
      // Detectar si es YouTube o Vimeo
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
        if (videoId) {
          insertText(`\n<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>\n`)
        }
      } else if (url.includes('vimeo.com')) {
        const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
        if (videoId) {
          insertText(`\n<iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen></iframe>\n`)
        }
      } else {
        insertText(`\n<video src="${url}" controls></video>\n`)
      }
    }
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**'), title: 'Negrita' },
    { icon: Italic, action: () => insertText('*', '*'), title: 'Cursiva' },
    { icon: Underline, action: () => insertText('<u>', '</u>'), title: 'Subrayado' },
    { icon: Code, action: () => insertText('`', '`'), title: 'Código' },
    { icon: Quote, action: () => insertText('> ', ''), title: 'Cita' },
    { icon: List, action: () => insertText('- ', ''), title: 'Lista' },
    { icon: ListOrdered, action: () => insertText('1. ', ''), title: 'Lista numerada' },
    { icon: LinkIcon, action: () => {
      const url = prompt('Ingresa la URL:')
      if (url) {
        const text = prompt('Ingresa el texto del enlace:', url) || url
        insertText(`[${text}](${url})`)
      }
    }, title: 'Enlace' },
    { icon: Image, action: handleImageUrl, title: 'Imagen (URL)' },
    { icon: Video, action: handleVideoUrl, title: 'Video (URL)' },
  ]

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap flex-shrink-0">
        {toolbarButtons.map((button, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={button.action}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-900"
            title={button.title}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isUploading}
          >
            <button.icon className="w-4 h-4" />
          </motion.button>
        ))}
        <div className="flex-1" />
        <div className="text-xs text-gray-500 px-2">
          {isUploading && 'Subiendo...'}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full flex-1 px-4 py-3 border-0 focus:ring-0 resize-none text-base"
        />
      </div>

      {/* Preview toggle (opcional) */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex-shrink-0">
        <span>💡 Tip: Usa Markdown para formato. Ejemplo: **negrita**, *cursiva*, [enlace](url)</span>
      </div>
    </div>
  )
}

