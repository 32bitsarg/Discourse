'use client'

import { useMemo } from 'react'

interface PostContentRendererProps {
  content: string
}

export default function PostContentRenderer({ content }: PostContentRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return ''

    let html = content

    // Primero, proteger HTML existente (iframes, videos, etc.)
    const htmlBlocks: string[] = []
    html = html.replace(/<iframe[^>]*>.*?<\/iframe>/g, (match) => {
      htmlBlocks.push(match)
      return `__HTML_BLOCK_${htmlBlocks.length - 1}__`
    })
    html = html.replace(/<video[^>]*>.*?<\/video>/g, (match) => {
      htmlBlocks.push(match)
      return `__HTML_BLOCK_${htmlBlocks.length - 1}__`
    })

    // Convertir Markdown básico a HTML
    // Negrita (debe ir antes de cursiva)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Cursiva (solo si no está dentro de negrita)
    html = html.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    
    // Código inline
    html = html.replace(/`([^`]+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    
    // Imágenes Markdown - PROCESAR ANTES que los enlaces para evitar conflictos
    // Manejar base64 que puede tener saltos de línea
    // Usar regex más robusto que capture URLs base64 completas incluso con saltos de línea
    const imagePlaceholders: string[] = []
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gs, (match, alt, src) => {
      // Limpiar saltos de línea y espacios en URLs base64
      let cleanSrc = src.replace(/\s+/g, '').trim()
      
      if (cleanSrc.startsWith('data:')) {
        // Base64 image - asegurar que esté completa y tenga el formato correcto
        if (cleanSrc.length > 100 && cleanSrc.includes('base64,')) { // Base64 mínimo razonable
          const placeholder = `__IMAGE_PLACEHOLDER_${imagePlaceholders.length}__`
          imagePlaceholders.push(`<div class="my-4"><img src="${cleanSrc}" alt="${alt || 'Imagen'}" class="w-full h-auto rounded-lg shadow-sm object-contain" loading="lazy" onerror="this.style.display='none'" style="max-height: none;" /></div>`)
          return placeholder
        }
      } else if (cleanSrc && !cleanSrc.startsWith('<')) {
        // URL image (no HTML)
        const placeholder = `__IMAGE_PLACEHOLDER_${imagePlaceholders.length}__`
        imagePlaceholders.push(`<div class="my-4"><img src="${cleanSrc}" alt="${alt || 'Imagen'}" class="w-full h-auto rounded-lg shadow-sm object-contain" loading="lazy" onerror="this.style.display='none'" style="max-height: none;" /></div>`)
        return placeholder
      }
      return match // Si no cumple condiciones, devolver original
    })
    
    // También manejar imágenes base64 que puedan estar en múltiples líneas sin formato markdown
    // Buscar patrones de base64 que puedan estar rotos en múltiples líneas
    html = html.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=\s]+/gs, (match) => {
      const cleanMatch = match.replace(/\s+/g, '').trim()
      if (cleanMatch.length > 100 && cleanMatch.includes('base64,')) {
        const placeholder = `__IMAGE_PLACEHOLDER_${imagePlaceholders.length}__`
        imagePlaceholders.push(`<div class="my-4"><img src="${cleanMatch}" alt="Imagen" class="w-full h-auto rounded-lg shadow-sm object-contain" loading="lazy" onerror="this.style.display='none'" style="max-height: none;" /></div>`)
        return placeholder
      }
      return match
    })
    
    // Enlaces - PROCESAR DESPUÉS de las imágenes para evitar conflictos
    // Solo procesar enlaces que NO sean imágenes (que no tengan ! antes)
    html = html.replace(/(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      // Verificar que no sea parte de una imagen ya procesada
      if (url.startsWith('data:image/') || url.startsWith('data:')) {
        return match // No procesar si es una imagen base64
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700 underline">${text}</a>`
    })
    
    // Restaurar placeholders de imágenes
    imagePlaceholders.forEach((imgHtml, index) => {
      html = html.replace(`__IMAGE_PLACEHOLDER_${index}__`, imgHtml)
    })
    
    // Restaurar bloques HTML
    htmlBlocks.forEach((block, index) => {
      html = html.replace(`__HTML_BLOCK_${index}__`, block)
    })
    
    // Procesar videos e iframes
    html = html.replace(/<video src="([^"]+)" controls><\/video>/g, (match, src) => {
      return `<div class="my-4"><video src="${src}" controls class="max-w-full h-auto rounded-lg shadow-sm"></video></div>`
    })
    
    html = html.replace(/<iframe([^>]+)><\/iframe>/g, (match) => {
      // Extraer src del iframe
      const srcMatch = match.match(/src="([^"]+)"/)
      if (srcMatch) {
        return `<div class="my-4 aspect-video rounded-lg overflow-hidden shadow-sm bg-gray-100"><iframe${match.match(/<iframe([^>]+)>/)?.[1] || ''} class="w-full h-full border-0"></iframe></div>`
      }
      return match
    })
    
    // Citas (debe procesarse línea por línea)
    const lines = html.split('\n')
    const processedLines: string[] = []
    let inBlockquote = false
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith('>')) {
        const quoteText = line.replace(/^>\s*/, '')
        if (!inBlockquote) {
          processedLines.push('<blockquote class="border-l-4 border-primary-500 pl-4 py-2 my-2 italic text-gray-700 bg-gray-50 rounded-r">')
          inBlockquote = true
        }
        processedLines.push(`<p class="mb-1">${quoteText}</p>`)
      } else {
        if (inBlockquote) {
          processedLines.push('</blockquote>')
          inBlockquote = false
        }
        if (line.trim()) {
          processedLines.push(line)
        }
      }
    })
    if (inBlockquote) {
      processedLines.push('</blockquote>')
    }
    html = processedLines.join('\n')
    
    // Listas
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
    
    // Agrupar listas consecutivas
    html = html.replace(/(<li[^>]*>.*?<\/li>(?:\s*<li[^>]*>.*?<\/li>)*)/gs, (match) => {
      if (!match.includes('<ul') && !match.includes('<ol')) {
        return `<ul class="list-disc ml-6 my-2 space-y-1">${match}</ul>`
      }
      return match
    })
    
    // Párrafos (solo si no es HTML)
    html = html.split('\n\n').map(para => {
      const trimmed = para.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<') || trimmed.startsWith('</')) {
        return trimmed // Ya es HTML
      }
      if (trimmed.match(/^<[a-z]+/)) {
        return trimmed // Ya es HTML
      }
      return `<p class="mb-3 leading-relaxed">${trimmed}</p>`
    }).join('\n')
    
    // Limpiar párrafos vacíos
    html = html.replace(/<p class="mb-3[^"]*">\s*<\/p>/g, '')

    return html
  }, [content])

  return (
    <div 
      className="prose prose-sm max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
      style={{
        wordBreak: 'break-word',
      }}
    />
  )
}

