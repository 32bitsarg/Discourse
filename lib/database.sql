-- ============================================
-- DISCOURSE - Base de Datos Completa
-- ============================================
-- Este archivo contiene el esquema completo de la base de datos
-- y datos de ejemplo para desarrollo y testing
-- ============================================

-- ============================================
-- ESQUEMA DE BASE DE DATOS
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  bio TEXT,
  banner_url VARCHAR(500),
  website VARCHAR(255),
  location VARCHAR(100),
  theme_color VARCHAR(7) DEFAULT '#6366f1',
  karma INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_email_verified (email_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories (main forums) - Opcional, no se usa actualmente
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subforums (user-created communities)
CREATE TABLE IF NOT EXISTS subforums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  creator_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  rules TEXT,
  member_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_slug (slug),
  INDEX idx_category (category_id),
  INDEX idx_creator (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subforum_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content MEDIUMTEXT NOT NULL,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_hot BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subforum_id) REFERENCES subforums(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subforum (subforum_id),
  INDEX idx_author (author_id),
  INDEX idx_created (created_at),
  INDEX idx_hot (is_hot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  parent_id INT,
  content MEDIUMTEXT NOT NULL,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_author (author_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Votes (for posts and comments)
CREATE TABLE IF NOT EXISTS votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT,
  comment_id INT,
  vote_type ENUM('up', 'down') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  UNIQUE KEY unique_post_vote (user_id, post_id),
  UNIQUE KEY unique_comment_vote (user_id, comment_id),
  INDEX idx_user (user_id),
  INDEX idx_post (post_id),
  INDEX idx_comment (comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Subforum members
CREATE TABLE IF NOT EXISTS subforum_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subforum_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subforum_id) REFERENCES subforums(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membership (subforum_id, user_id),
  INDEX idx_subforum (subforum_id),
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User social links
CREATE TABLE IF NOT EXISTS user_social_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_platform (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User projects/portfolio
CREATE TABLE IF NOT EXISTS user_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  project_url VARCHAR(500),
  category VARCHAR(50),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User follows (following system)
CREATE TABLE IF NOT EXISTS user_follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id),
  CHECK (follower_id != following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User interests (for recommendation algorithm)
CREATE TABLE IF NOT EXISTS user_interests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(50) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_interest (user_id, category),
  INDEX idx_user (user_id),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User behavior tracking (for recommendation algorithm)
CREATE TABLE IF NOT EXISTS user_behavior (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT,
  action_type VARCHAR(50) NOT NULL,
  duration_seconds INT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_post (post_id),
  INDEX idx_action (action_type),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- External platform connections (Twitter, Instagram, etc.)
CREATE TABLE IF NOT EXISTS user_platform_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'instagram', 'facebook', 'linkedin', 'tiktok'
  platform_user_id VARCHAR(255), -- ID del usuario en la plataforma externa
  platform_username VARCHAR(255), -- Username en la plataforma externa
  access_token TEXT, -- Token de acceso OAuth (encriptado en producción)
  refresh_token TEXT, -- Token de refresh OAuth
  token_expires_at TIMESTAMP NULL, -- Cuando expira el token
  is_active BOOLEAN DEFAULT TRUE,
  auto_share BOOLEAN DEFAULT FALSE, -- Compartir automáticamente posts
  auto_sync BOOLEAN DEFAULT FALSE, -- Sincronizar contenido automáticamente
  sync_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_sync_at TIMESTAMP NULL,
  metadata JSON, -- Información adicional de la plataforma
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_platform (user_id, platform),
  INDEX idx_user (user_id),
  INDEX idx_platform (platform),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shared posts to external platforms
CREATE TABLE IF NOT EXISTS post_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  platform_post_id VARCHAR(255), -- ID del post en la plataforma externa
  share_url VARCHAR(500), -- URL del post compartido
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_user (user_id),
  INDEX idx_platform (platform),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Imported content from external platforms
CREATE TABLE IF NOT EXISTS imported_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  platform_content_id VARCHAR(255) NOT NULL, -- ID del contenido en la plataforma externa
  platform_content_url VARCHAR(500), -- URL original del contenido
  post_id INT, -- ID del post creado aquí (si se importó como post)
  content_type VARCHAR(50) NOT NULL, -- 'post', 'image', 'video', 'story'
  title TEXT,
  content TEXT,
  media_urls JSON, -- Array de URLs de imágenes/videos
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP NULL,
  metadata JSON, -- Información adicional del contenido original
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
  UNIQUE KEY unique_platform_content (platform, platform_content_id),
  INDEX idx_user (user_id),
  INDEX idx_platform (platform),
  INDEX idx_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================
-- Descomenta las siguientes líneas si quieres datos de ejemplo
-- Las contraseñas de ejemplo son: password123

/*
-- Insertar usuarios de ejemplo
-- Password hash para "password123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (username, email, password_hash, karma) VALUES
('juan_perez', 'juan@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 150),
('maria_garcia', 'maria@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 89)
ON DUPLICATE KEY UPDATE username=username;

-- Obtener IDs de usuarios
SET @juan_id = (SELECT id FROM users WHERE username = 'juan_perez' LIMIT 1);
SET @maria_id = (SELECT id FROM users WHERE username = 'maria_garcia' LIMIT 1);

-- Insertar comunidades de ejemplo
INSERT INTO subforums (creator_id, name, slug, description, member_count, post_count, is_public, requires_approval) VALUES
(@juan_id, 'Programación Web', 'programacion-web', 'Discusiones sobre desarrollo web, frameworks y tecnologías modernas', 45, 23, TRUE, FALSE),
(@maria_id, 'Diseño UI/UX', 'diseno-ui-ux', 'Comparte tus diseños, tips y recursos de diseño de interfaces', 67, 34, TRUE, FALSE),
(@juan_id, 'Proyectos Personales', 'proyectos-personales', 'Muestra tus proyectos y recibe feedback de la comunidad', 32, 18, TRUE, FALSE)
ON DUPLICATE KEY UPDATE name=name;

-- Obtener IDs de subforos
SET @prog_id = (SELECT id FROM subforums WHERE slug = 'programacion-web' LIMIT 1);
SET @diseno_id = (SELECT id FROM subforums WHERE slug = 'diseno-ui-ux' LIMIT 1);
SET @proyectos_id = (SELECT id FROM subforums WHERE slug = 'proyectos-personales' LIMIT 1);

-- Insertar posts de ejemplo
INSERT INTO posts (subforum_id, author_id, title, content, upvotes, downvotes, comment_count, is_hot) VALUES
(@prog_id, @juan_id, '¿Cuál es el mejor framework para React en 2024?', 'Estoy empezando con React y quiero saber qué framework o librería recomiendan para el estado global y routing. ¿Next.js, Remix, o algo más?', 45, 2, 12, TRUE),
(@prog_id, @maria_id, 'Guía completa de TypeScript para principiantes', 'Comparto esta guía que me ayudó mucho cuando empecé con TypeScript. Incluye ejemplos prácticos y mejores prácticas.', 89, 1, 23, FALSE),
(@diseno_id, @maria_id, 'Paleta de colores para aplicaciones modernas', 'Aquí está mi colección de paletas de colores que uso en mis proyectos. ¿Qué opinan?', 67, 0, 15, TRUE),
(@diseno_id, @juan_id, 'Herramientas gratuitas para diseño de interfaces', 'Lista de herramientas gratuitas que uso para diseñar: Figma, Canva, etc. ¿Alguna otra recomendación?', 34, 3, 8, FALSE),
(@proyectos_id, @juan_id, 'Mi primera aplicación con Next.js', 'Comparto mi primera aplicación hecha con Next.js. Acepto feedback y sugerencias para mejorarla.', 56, 1, 18, FALSE),
(@proyectos_id, @maria_id, 'Portfolio personal - ¿Qué opinan?', 'Acabo de terminar mi portfolio personal. ¿Les gusta el diseño? ¿Algún consejo para mejorarlo?', 78, 2, 25, TRUE)
ON DUPLICATE KEY UPDATE title=title;

-- Agregar miembros a los subforos
INSERT INTO subforum_members (subforum_id, user_id, role, status) VALUES
(@prog_id, @juan_id, 'admin', 'approved'),
(@prog_id, @maria_id, 'member', 'approved'),
(@diseno_id, @maria_id, 'admin', 'approved'),
(@diseno_id, @juan_id, 'member', 'approved'),
(@proyectos_id, @juan_id, 'admin', 'approved'),
(@proyectos_id, @maria_id, 'member', 'approved')
ON DUPLICATE KEY UPDATE role=role;
*/

-- Settings (configuración del sitio)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar configuración por defecto
INSERT INTO settings (key_name, value, description) VALUES
-- Configuración General
('site_name', 'Discourse', 'Nombre del sitio/foro'),
('site_description', 'Plataforma de foros y comunidades', 'Descripción del sitio'),
-- Apariencia y Branding
('site_logo', '', 'URL del logo del sitio'),
('site_favicon', '', 'URL del favicon'),
('primary_color', '#6366f1', 'Color primario del tema'),
('header_banner', '', 'URL del banner/header image'),
('meta_title', '', 'Meta title para SEO'),
('meta_description', '', 'Meta description para SEO'),
('meta_keywords', '', 'Meta keywords para SEO'),
-- Configuración de Usuarios
('public_registration', 'true', 'Permitir registro público'),
('email_verification_required', 'false', 'Requiere verificación de email'),
('minimum_age', '13', 'Edad mínima para registrarse'),
('allow_custom_avatars', 'true', 'Permitir avatares personalizados'),
('allow_profile_banners', 'true', 'Permitir banners de perfil'),
('min_karma_create_community', '0', 'Karma mínimo para crear comunidades'),
-- Configuración de Contenido
('allow_community_creation', 'true', 'Permitir creación de comunidades'),
('community_approval_required', 'false', 'Requiere aprobación para nuevas comunidades'),
('max_post_length', '10000', 'Límite de caracteres en posts'),
('max_comment_length', '5000', 'Límite de caracteres en comentarios'),
('allow_images_in_posts', 'true', 'Permitir imágenes en posts'),
('allow_videos_in_posts', 'true', 'Permitir videos en posts'),
('allow_external_links', 'true', 'Permitir enlaces externos'),
('banned_words', '', 'Palabras prohibidas (separadas por comas)'),
-- Configuración de Votación
('show_vote_counts', 'true', 'Mostrar contador de votos'),
('allow_downvotes', 'true', 'Permitir downvotes'),
('min_karma_to_vote', '0', 'Karma mínimo para votar'),
('min_karma_to_comment', '0', 'Karma mínimo para comentar'),
-- Email y Notificaciones
('admin_email', '', 'Email del administrador'),
('send_welcome_emails', 'true', 'Enviar emails de bienvenida'),
('send_post_notifications', 'false', 'Enviar notificaciones de nuevos posts'),
-- SEO y Analytics
('google_analytics_id', '', 'Google Analytics ID'),
-- Seguridad
('rate_limit_per_minute', '60', 'Rate limiting (requests por minuto)'),
('captcha_on_registration', 'false', 'CAPTCHA en registro'),
('captcha_on_posts', 'false', 'CAPTCHA en posts')
ON DUPLICATE KEY UPDATE value=value;

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_token (token),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reports (sistema de reportes)
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT,
  comment_id INT,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  action_taken VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_post (post_id),
  INDEX idx_comment (comment_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- FIN DEL ESQUEMA
-- ============================================

