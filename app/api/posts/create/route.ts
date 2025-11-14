import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateKeys } from '@/lib/redis'
import { generateSlug, ensureUniqueSlug } from '@/lib/utils/slug'
import {
  getMaxPostLength,
  containsBannedWords,
  areImagesAllowedInPosts,
  areVideosAllowedInPosts,
  areExternalLinksAllowed,
  isCaptchaRequiredOnPosts,
} from '@/lib/settings-validation'
import { sendPostNotificationEmail } from '@/lib/email'
import { getSetting } from '@/lib/settings'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { verifyRecaptcha } from '@/lib/captcha'
import { isUserBanned } from '@/lib/moderation'
import {
  extractBase64Images,
  replaceBase64WithPlaceholders,
  compressImage,
} from '@/lib/image-compression'

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limit
    const rateLimit = await checkRateLimit(request, 'create_post')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createRateLimitResponse(rateLimit.remaining, rateLimit.resetAt, rateLimit.limit),
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.resetAt.toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          }
        }
      )
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para crear un post' },
        { status: 401 }
      )
    }

    const { title, content, subforumId, captchaToken } = await request.json()

    // Verificar CAPTCHA si está habilitado
    const captchaRequired = await isCaptchaRequiredOnPosts()
    if (captchaRequired) {
      if (!captchaToken) {
        return NextResponse.json(
          { message: 'CAPTCHA requerido' },
          { status: 400 }
        )
      }

      const captchaValid = await verifyRecaptcha(captchaToken)
      if (!captchaValid) {
        return NextResponse.json(
          { message: 'CAPTCHA inválido. Por favor intenta de nuevo.' },
          { status: 400 }
        )
      }
    }

    if (!content || !subforumId) {
      return NextResponse.json(
        { message: 'Contenido y comunidad son requeridos' },
        { status: 400 }
      )
    }

    // Validar longitud máxima del post
    const maxLength = await getMaxPostLength()
    if (content.length > maxLength) {
      return NextResponse.json(
        { message: `El contenido no puede exceder ${maxLength} caracteres` },
        { status: 400 }
      )
    }

    // Validar palabras prohibidas
    const hasBannedWords = await containsBannedWords(content)
    if (hasBannedWords) {
      return NextResponse.json(
        { message: 'El contenido contiene palabras no permitidas' },
        { status: 400 }
      )
    }

    // Validar imágenes, videos y enlaces según configuración
    const imagesAllowed = await areImagesAllowedInPosts()
    const videosAllowed = await areVideosAllowedInPosts()
    const linksAllowed = await areExternalLinksAllowed()

    // Verificar si hay imágenes en el contenido
    if (!imagesAllowed && (content.includes('<img') || content.includes('![image]'))) {
      return NextResponse.json(
        { message: 'Las imágenes no están permitidas en los posts' },
        { status: 400 }
      )
    }

    // Verificar si hay videos en el contenido
    if (!videosAllowed && (content.includes('<video') || content.includes('![video]'))) {
      return NextResponse.json(
        { message: 'Los videos no están permitidos en los posts' },
        { status: 400 }
      )
    }

    // Verificar si hay enlaces externos en el contenido
    if (!linksAllowed) {
      const urlRegex = /(https?:\/\/[^\s]+)/g
      if (urlRegex.test(content)) {
        return NextResponse.json(
          { message: 'Los enlaces externos no están permitidos en los posts' },
          { status: 400 }
        )
      }
    }

    // Si no hay título, usar las primeras palabras del contenido
    const finalTitle = title?.trim() || content.trim().substring(0, 100).replace(/\n/g, ' ').trim() || 'Sin título'

    // Verificar que el subforum existe
    const [subforums] = await pool.execute(
      'SELECT id, name, slug FROM subforums WHERE id = ?',
      [subforumId]
    ) as any[]

    if (subforums.length === 0) {
      return NextResponse.json(
        { message: 'La comunidad no existe' },
        { status: 404 }
      )
    }

    const subforum = subforums[0]

    // Generar slug único para el post
    const baseSlug = generateSlug(finalTitle)
    const uniqueSlug = await ensureUniqueSlug(
      baseSlug,
      async (slug) => {
        const [existing] = await pool.execute(
          'SELECT id FROM posts WHERE slug = ?',
          [slug]
        ) as any[]
        return existing.length > 0
      }
    )

    // Extraer, comprimir y guardar imágenes separadamente
    const extractedImages = extractBase64Images(content)
    let processedContent = content
    const imageIds: number[] = []

    if (extractedImages.length > 0 && imagesAllowed) {
      // Procesar cada imagen: comprimir y guardar
      for (let i = 0; i < extractedImages.length; i++) {
        const image = extractedImages[i]
        try {
          // Comprimir imagen con máxima optimización
          const compressed = await compressImage(image.base64, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 85,
            format: 'webp', // WebP ofrece mejor compresión
          })

          // Guardar imagen comprimida en la base de datos (post_id se actualizará después)
          const [imageResult] = await pool.execute(
            'INSERT INTO post_images (post_id, image_data, mime_type, width, height, file_size, original_filename, display_order) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)',
            [
              compressed.buffer,
              compressed.mimeType,
              compressed.width,
              compressed.height,
              compressed.fileSize,
              image.alt || `image-${i + 1}`,
              i,
            ]
          ) as any

          imageIds.push(imageResult.insertId)
        } catch (error) {
          console.error(`Error comprimiendo imagen ${i + 1}:`, error)
          // Si falla la compresión, mantener la imagen original (fallback)
        }
      }

      // Reemplazar imágenes base64 con placeholders
      if (imageIds.length > 0) {
        processedContent = replaceBase64WithPlaceholders(content, imageIds)
      }
    }

    // Crear el post con contenido procesado (sin imágenes base64)
    const [result] = await pool.execute(
      'INSERT INTO posts (subforum_id, author_id, title, slug, content) VALUES (?, ?, ?, ?, ?)',
      [subforumId, user.id, finalTitle, uniqueSlug, processedContent]
    ) as any

    // Actualizar post_id en las imágenes guardadas
    if (imageIds.length > 0) {
      const placeholders = imageIds.map(() => '?').join(',')
      await pool.execute(
        `UPDATE post_images SET post_id = ? WHERE id IN (${placeholders})`,
        [result.insertId, ...imageIds]
      )
    }

    // Actualizar contador de posts en el subforum
    await pool.execute(
      'UPDATE subforums SET post_count = post_count + 1 WHERE id = ?',
      [subforumId]
    )

    // Enviar notificaciones de nuevo post si está habilitado
    const sendPostNotifications = await getSetting('send_post_notifications')
    if (sendPostNotifications === 'true') {
      // Obtener miembros de la comunidad que quieren recibir notificaciones
      const [members] = await pool.execute(
        'SELECT DISTINCT u.email, u.username FROM subforum_members sm JOIN users u ON sm.user_id = u.id WHERE sm.subforum_id = ? AND sm.status = ? AND u.id != ?',
        [subforumId, 'approved', user.id]
      ) as any[]

      const postUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/r/${subforum.slug}/${uniqueSlug}`
      
      // Enviar emails en background
      members.forEach((member: any) => {
        sendPostNotificationEmail(
          member.email,
          member.username,
          finalTitle,
          postUrl,
          user.username
        ).catch(error => {
          console.error(`Error enviando notificación a ${member.email}:`, error)
        })
      })
    }

        // Invalidar cache específico: stats y subforums (keys conocidas)
        // Nota: No invalidamos posts porque el TTL corto (45-60s) se encarga
        // y Upstash no soporta invalidación por patrón eficientemente
        await invalidateKeys([
          'stats:global',
          'subforums:list',
          `user:${user.id}:subforum_ids`
        ])

    return NextResponse.json({
      message: 'Post creado exitosamente',
      post: {
        id: result.insertId,
        title: finalTitle,
        slug: uniqueSlug,
        subforumSlug: subforum.slug,
        content,
        subforumId,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al crear el post' },
      { status: 500 }
    )
  }
}

