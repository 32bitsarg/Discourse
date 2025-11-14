-- ============================================
-- MIGRACIÓN: Agregar Índices de Performance
-- ============================================
-- Este script agrega índices compuestos y adicionales
-- para optimizar queries comunes
-- ============================================

-- Índices para Posts
-- Índice compuesto para queries de feed por comunidad ordenado por fecha
-- NOTA: MySQL no soporta IF NOT EXISTS, el script JS manejará errores de duplicados
CREATE INDEX idx_posts_subforum_created ON posts (subforum_id, created_at DESC);

-- Índice para slug (si existe la columna slug en posts)
-- NOTA: Verificar que la columna slug existe antes de crear este índice
-- Si no existe, comentar esta línea o agregar la columna primero
-- CREATE INDEX idx_posts_slug ON posts (slug);

-- Índice para edited_at (si se usa para queries)
CREATE INDEX idx_posts_edited ON posts (edited_at DESC);

-- Índice compuesto para hot posts
CREATE INDEX idx_posts_hot_created ON posts (is_hot, created_at DESC);

-- Índices para Comments
-- Índice compuesto para cargar comentarios de un post ordenados
CREATE INDEX idx_comments_post_created ON comments (post_id, created_at ASC);

-- Índice para queries de replies (parent_id + fecha)
CREATE INDEX idx_comments_parent_created ON comments (parent_id, created_at ASC);

-- Índice para created_at DESC (para ordenar comentarios nuevos)
CREATE INDEX idx_comments_created_desc ON comments (created_at DESC);

-- Índices para Votes
-- Índice compuesto para obtener votos de usuario en posts
CREATE INDEX idx_votes_user_post_type ON votes (user_id, post_id, vote_type);

-- Índice compuesto para obtener votos de usuario en comentarios
CREATE INDEX idx_votes_user_comment_type ON votes (user_id, comment_id, vote_type);

-- Índices para Subforums
-- Índice para member_count (si se usa para ordenar)
CREATE INDEX idx_subforums_member_count ON subforums (member_count DESC);

-- Índice compuesto para queries de comunidades públicas ordenadas
CREATE INDEX idx_subforums_public_created ON subforums (is_public, created_at DESC);

-- Verificar si existen índices en user_follows
-- Si no existen, crearlos
CREATE INDEX idx_user_follows_follower ON user_follows (follower_id);
CREATE INDEX idx_user_follows_following ON user_follows (following_id);

-- Verificar si existen índices en subforum_members
-- Si no existen, crearlos
CREATE INDEX idx_subforum_members_user ON subforum_members (user_id);
CREATE INDEX idx_subforum_members_subforum ON subforum_members (subforum_id);
CREATE INDEX idx_subforum_members_status ON subforum_members (status);
-- Índice compuesto para queries comunes
CREATE INDEX idx_subforum_members_user_status ON subforum_members (user_id, status);

-- ============================================
-- NOTA: MySQL no soporta "IF NOT EXISTS" en ALTER TABLE ADD INDEX
-- Si los índices ya existen, el script fallará con un error
-- que puede ser ignorado de forma segura
-- ============================================

