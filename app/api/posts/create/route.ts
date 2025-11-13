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
} from '@/lib/settings-validation'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para crear un post' },
        { status: 401 }
      )
    }

    const { title, content, subforumId } = await request.json()

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

    // Crear el post con slug
    const [result] = await pool.execute(
      'INSERT INTO posts (subforum_id, author_id, title, slug, content) VALUES (?, ?, ?, ?, ?)',
      [subforumId, user.id, finalTitle, uniqueSlug, content]
    ) as any

    // Actualizar contador de posts en el subforum
    await pool.execute(
      'UPDATE subforums SET post_count = post_count + 1 WHERE id = ?',
      [subforumId]
    )

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

