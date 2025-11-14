import sharp from 'sharp'

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'avif'
  progressive?: boolean
}

export interface CompressionResult {
  buffer: Buffer
  mimeType: string
  width: number
  height: number
  fileSize: number
  originalSize: number
  compressionRatio: number
}

/**
 * Comprime una imagen base64 o Buffer con sharp
 * Optimiza al máximo sin perder calidad visual significativa
 */
export async function compressImage(
  input: string | Buffer,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85, // Calidad alta pero con compresión efectiva
    format = 'webp', // WebP ofrece mejor compresión que JPEG
    progressive = true,
  } = options

  // Convertir base64 a Buffer si es necesario
  let imageBuffer: Buffer
  let originalSize: number

  if (typeof input === 'string') {
    // Es base64
    const base64Data = input.replace(/^data:image\/\w+;base64,/, '')
    imageBuffer = Buffer.from(base64Data, 'base64')
    originalSize = imageBuffer.length
  } else {
    imageBuffer = input
    originalSize = input.length
  }

  // Obtener metadata de la imagen original
  const metadata = await sharp(imageBuffer).metadata()
  const originalWidth = metadata.width || 0
  const originalHeight = metadata.height || 0

  // Determinar formato de salida basado en el formato original
  let outputFormat: 'jpeg' | 'webp' | 'avif' = format
  let mimeType = `image/${format}`

  // Si la imagen original es PNG con transparencia, usar WebP para mantenerla
  if (metadata.format === 'png' && metadata.hasAlpha) {
    outputFormat = 'webp'
    mimeType = 'image/webp'
  }

  // Procesar imagen con sharp
  let pipeline = sharp(imageBuffer)

  // Redimensionar si es necesario (manteniendo aspect ratio)
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Aplicar compresión según formato
  if (outputFormat === 'webp') {
    pipeline = pipeline.webp({
      quality,
      effort: 6, // Máximo esfuerzo de compresión (0-6)
      smartSubsample: true,
    })
  } else if (outputFormat === 'avif') {
    pipeline = pipeline.avif({
      quality,
      effort: 9, // Máximo esfuerzo (0-9)
    })
    mimeType = 'image/avif'
  } else {
    // JPEG
    pipeline = pipeline.jpeg({
      quality,
      progressive,
      mozjpeg: true, // Usar mozjpeg para mejor compresión
    })
  }

  // Aplicar optimizaciones adicionales
  pipeline = pipeline
    .normalise() // Normalizar brillo/contraste
    .sharpen() // Aplicar sharpening sutil para mantener nitidez

  // Convertir a buffer
  const compressedBuffer = await pipeline.toBuffer()

  // Obtener dimensiones finales
  const finalMetadata = await sharp(compressedBuffer).metadata()
  const finalWidth = finalMetadata.width || originalWidth
  const finalHeight = finalMetadata.height || originalHeight

  const compressionRatio = ((originalSize - compressedBuffer.length) / originalSize) * 100

  return {
    buffer: compressedBuffer,
    mimeType,
    width: finalWidth,
    height: finalHeight,
    fileSize: compressedBuffer.length,
    originalSize,
    compressionRatio,
  }
}

/**
 * Extrae imágenes base64 de un texto markdown
 */
export function extractBase64Images(content: string): Array<{
  match: string
  alt: string
  base64: string
  index: number
}> {
  const images: Array<{ match: string; alt: string; base64: string; index: number }> = []
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/gs
  let match

  while ((match = regex.exec(content)) !== null) {
    const [, alt, src] = match
    const cleanSrc = src.replace(/\s+/g, '').trim()

    if (cleanSrc.startsWith('data:image/')) {
      images.push({
        match: match[0],
        alt: alt || 'Imagen',
        base64: cleanSrc,
        index: match.index,
      })
    }
  }

  return images
}

/**
 * Reemplaza imágenes base64 con placeholders que apuntan al endpoint de imágenes
 */
export function replaceBase64WithPlaceholders(
  content: string,
  imageIds: number[]
): string {
  let result = content
  const images = extractBase64Images(content)

  images.forEach((image, index) => {
    if (imageIds[index] !== undefined) {
      const placeholder = `![${image.alt}](/api/images/${imageIds[index]})`
      result = result.replace(image.match, placeholder)
    }
  })

  return result
}

