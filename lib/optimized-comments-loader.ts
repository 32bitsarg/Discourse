import pool from '@/lib/db'

/**
 * Carga todos los comentarios de un post de forma optimizada
 * Evita queries N+1 cargando todo en una sola query con CTE recursivo
 */
export async function loadAllCommentsOptimized(
  postId: number,
  currentUserId: number | null,
  maxDepth: number = 5
): Promise<any[]> {
  // MySQL no soporta CTE recursivos de forma nativa en versiones antiguas
  // Usamos una estrategia de carga en batch: cargar todos los comentarios de una vez
  // y luego construir el árbol en memoria

  // Cargar TODOS los comentarios del post de una vez
  const [allComments] = await pool.execute(`
    SELECT 
      c.id,
      c.content,
      c.upvotes,
      c.downvotes,
      c.created_at,
      c.edited_at,
      c.author_id,
      c.parent_id,
      u.username as author_username
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `, [postId]) as any[]

  if (allComments.length === 0) {
    return []
  }

  // Obtener todos los IDs de comentarios
  const commentIds = allComments.map((c: any) => c.id)

  // Obtener TODOS los votos del usuario de una vez (si está logueado)
  let userVotes: Record<number, 'up' | 'down'> = {}
  if (currentUserId && commentIds.length > 0) {
    const placeholders = commentIds.map(() => '?').join(',')
    const [votes] = await pool.execute(
      `SELECT comment_id, vote_type FROM votes WHERE user_id = ? AND comment_id IN (${placeholders})`,
      [currentUserId, ...commentIds]
    ) as any[]
    
    votes.forEach((v: any) => {
      userVotes[v.comment_id] = v.vote_type
    })
  }

  // Construir mapa de comentarios por ID
  const commentsMap = new Map<number, any>()
  allComments.forEach((comment: any) => {
    commentsMap.set(comment.id, {
      ...comment,
      replies: [],
      depth: 0,
    })
  })

  // Construir árbol de comentarios
  const rootComments: any[] = []
  const now = new Date()

  allComments.forEach((comment: any) => {
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      author_username: comment.author_username || 'Usuario desconocido',
      author_id: comment.author_id,
      upvotes: comment.upvotes || 0,
      downvotes: comment.downvotes || 0,
      created_at: comment.created_at,
      edited_at: comment.edited_at,
      timeAgo: formatTimeAgo(comment.created_at, now),
      canEdit: currentUserId === comment.author_id,
      canDelete: currentUserId === comment.author_id,
      userVote: userVotes[comment.id] || null,
      parent_id: comment.parent_id,
      depth: 0,
      replies: [],
    }

    if (!comment.parent_id || comment.parent_id === 0) {
      // Comentario raíz
      rootComments.push(formattedComment)
    } else {
      // Comentario hijo - agregar al padre
      const parent = commentsMap.get(comment.parent_id)
      if (parent) {
        // Calcular profundidad basado en el padre
        formattedComment.depth = (parent.depth || 0) + 1
        
        // Solo agregar si no excede la profundidad máxima
        if (formattedComment.depth <= maxDepth) {
          parent.replies = parent.replies || []
          parent.replies.push(formattedComment)
        }
      }
    }

    commentsMap.set(comment.id, formattedComment)
  })

  // Ordenar comentarios raíz por fecha descendente
  rootComments.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Ordenar replies por fecha ascendente (más antiguos primero)
  function sortReplies(comments: any[]) {
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a: any, b: any) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
        sortReplies(comment.replies)
      }
    })
  }

  sortReplies(rootComments)

  return rootComments
}

function formatTimeAgo(date: Date | string, now: Date): string {
  const createdAt = new Date(date)
  const diff = now.getTime() - createdAt.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'hace unos segundos'
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  return `hace ${days} día${days > 1 ? 's' : ''}`
}

