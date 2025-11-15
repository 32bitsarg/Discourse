import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const subforumId = searchParams.get('subforum_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Obtener usuario actual (si está logueado)
    const currentUser = await getCurrentUser()
    const userId = currentUser?.id

    // NOTA: No usamos cache para posts porque contienen imágenes base64 grandes
    // Cachear posts completos consumiría demasiado espacio en Redis
    // En su lugar, optimizamos las consultas a la BD con índices

    // Obtener IDs de comunidades del usuario (si está logueado) - con cache
    let userSubforumIds: number[] = []
    if (userId) {
      const userMembershipsCacheKey = `user:${userId}:subforum_ids`
      const cachedMemberships = await getCache<number[]>(userMembershipsCacheKey)
      
      if (cachedMemberships) {
        userSubforumIds = cachedMemberships
      } else {
        const [userMemberships] = await pool.execute(
          'SELECT subforum_id FROM subforum_members WHERE user_id = ? AND status = ?',
          [userId, 'approved']
        ) as any[]
        userSubforumIds = userMemberships.map((m: any) => m.subforum_id)
        // Cache por 10 minutos (se guarda en Upstash porque TTL > 2min)
        await setCache(userMembershipsCacheKey, userSubforumIds, 600)
      }
    }

    // Optimizar query: solo traer campos necesarios
    // Para el feed, no necesitamos el contenido completo (solo preview)
    let query = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        SUBSTRING(p.content, 1, 500) as content_preview,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.is_hot,
        p.is_pinned,
        p.created_at,
        p.edited_at,
        s.id as subforum_id,
        s.name as subforum_name,
        s.slug as subforum_slug,
        s.is_public,
        u.username as author_username,
        u.id as author_id
      FROM posts p
      LEFT JOIN subforums s ON p.subforum_id = s.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE 1=1
    `

    const params: any[] = []

    if (subforumId) {
      query += ' AND p.subforum_id = ?'
      params.push(subforumId)
    } else {
      // Si no es una comunidad específica, filtrar comunidades privadas
      // Mostrar solo comunidades públicas O comunidades del usuario
      if (userId && userSubforumIds.length > 0) {
        const placeholders = userSubforumIds.map(() => '?').join(',')
        query += ` AND (s.is_public = TRUE OR s.id IN (${placeholders}))`
        params.push(...userSubforumIds)
      } else {
        // Si no está logueado, solo mostrar públicas
        query += ' AND s.is_public = TRUE'
      }
    }

    // Excluir posts de comunidades pendientes de aprobación
    query += ' AND (s.requires_approval = FALSE OR s.requires_approval IS NULL)'
    
    // Excluir posts ocultos del usuario (si está logueado)
    if (userId) {
      query += ' AND p.id NOT IN (SELECT post_id FROM hidden_posts WHERE user_id = ?)'
      params.push(userId)
    }

    // Aplicar filtros y ordenamiento
    if (filter === 'hot') {
      // Hot: ordenar por upvotes (me gusta) descendente, solo comunidades públicas
      query += ' ORDER BY p.upvotes DESC, p.created_at DESC'
    } else if (filter === 'new') {
      query += ' ORDER BY p.created_at DESC'
    } else if (filter === 'top') {
      query += ' ORDER BY (p.upvotes - p.downvotes) DESC'
        } else {
          // 'all' - mostrar todos ordenados por fecha
          query += ' ORDER BY p.created_at DESC'
        }

        query += ` LIMIT ? OFFSET ?`
        params.push(limit, offset)

    const [posts] = await pool.execute(query, params) as any[]

    // Obtener el número real de comentarios para cada post (para asegurar sincronización)
    const postIds = posts.map((p: any) => p.id)
    let realCommentCounts: Record<number, number> = {}
    let userVotes: Record<number, 'up' | 'down'> = {}
    
    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',')
      const [commentCounts] = await pool.execute(
        `SELECT post_id, COUNT(*) as count FROM comments WHERE post_id IN (${placeholders}) GROUP BY post_id`,
        postIds
      ) as any[]
      
      commentCounts.forEach((cc: any) => {
        realCommentCounts[cc.post_id] = cc.count
      })

      // Obtener votos del usuario actual para todos los posts
      if (userId && postIds.length > 0) {
        const [votes] = await pool.execute(
          `SELECT post_id, vote_type FROM votes WHERE user_id = ? AND post_id IN (${placeholders})`,
          [userId, ...postIds]
        ) as any[]
        
        votes.forEach((v: any) => {
          userVotes[v.post_id] = v.vote_type
        })
      }
    }

        // Formatear fechas y sincronizar comment_count
        const formattedPosts = posts.map((post: any) => {
          const realCount = realCommentCounts[post.id] ?? 0
          // Si el comment_count en la BD no coincide con el real, usar el real
          const commentCount = realCount !== post.comment_count ? realCount : post.comment_count
          
          // Verificar si el usuario es miembro de esta comunidad
          const isMember = userId && userSubforumIds.includes(post.subforum_id)
          
          return {
            id: post.id,
            title: post.title,
            slug: post.slug || post.id.toString(), // Slug del post o ID como fallback
            content: post.content_preview || post.content, // Preview del contenido (500 chars)
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            comment_count: commentCount,
            is_hot: post.is_hot,
            is_pinned: post.is_pinned,
            created_at: post.created_at,
            edited_at: post.edited_at, // Fecha de edición
            subforum_id: post.subforum_id,
            subforum_name: post.subforum_name,
            subforum_slug: post.subforum_slug,
            is_public: post.is_public,
            userVote: userVotes[post.id] || null, // Voto del usuario actual
            author_username: post.author_username,
            author_id: post.author_id,
            canEdit: userId === post.author_id, // El usuario puede editar si es el autor
            canDelete: userId === post.author_id, // El usuario puede eliminar si es el autor
            timeAgo: getTimeAgo(post.created_at),
            isNew: isNewPost(post.created_at),
            isFromMemberCommunity: isMember || false,
          }
        })

    // Ordenar: primero posts de comunidades del usuario, luego el resto
    if (userId && userSubforumIds.length > 0) {
      formattedPosts.sort((a: any, b: any) => {
        if (a.isFromMemberCommunity && !b.isFromMemberCommunity) return -1
        if (!a.isFromMemberCommunity && b.isFromMemberCommunity) return 1
        return 0
      })
    }

        // Obtener el total de posts para saber si hay más páginas
        let totalCount = 0
        let countQuery = `
          SELECT COUNT(*) as total
          FROM posts p
          LEFT JOIN subforums s ON p.subforum_id = s.id
          WHERE 1=1
        `
        const countParams: any[] = []
        
        if (subforumId) {
          countQuery += ' AND p.subforum_id = ?'
          countParams.push(subforumId)
        } else {
          if (userId && userSubforumIds.length > 0) {
            const placeholders = userSubforumIds.map(() => '?').join(',')
            countQuery += ` AND (s.is_public = TRUE OR s.id IN (${placeholders}))`
            countParams.push(...userSubforumIds)
          } else {
            countQuery += ' AND s.is_public = TRUE'
          }
        }
        
        // Para 'hot' no necesitamos filtrar por is_hot, solo ordenamos por upvotes
        
        const [countResult] = await pool.execute(countQuery, countParams) as any[]
        totalCount = countResult[0]?.total || 0
        
        const hasMore = (offset + limit) < totalCount

        const result = { 
          posts: formattedPosts || [], // Contenido sin imágenes base64 (solo placeholders)
          pagination: {
            page,
            limit,
            total: totalCount,
            hasMore,
            totalPages: Math.ceil(totalCount / limit)
          }
        }

        // Caché HTTP para reducir Fast Origin Transfer
        // Los posts ahora no contienen imágenes base64, así que podemos cachear
        return NextResponse.json(result, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'CDN-Cache-Control': 'public, s-maxage=300',
            'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
          },
        })
  } catch (error: any) {
    // Si las tablas no existen, devolver array vacío
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ posts: [] })
    }
    
    return NextResponse.json({ posts: [] })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'hace unos segundos'
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  return `hace ${days} día${days > 1 ? 's' : ''}`
}

function isNewPost(date: Date): boolean {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const hours = diff / (1000 * 60 * 60)
  return hours < 24
}

