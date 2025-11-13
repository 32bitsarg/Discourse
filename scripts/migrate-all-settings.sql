-- ============================================
-- MIGRACIÓN: Agregar todos los settings
-- ============================================
-- Este script agrega todos los nuevos settings a bases de datos existentes
-- Ejecutar en producción para actualizar la base de datos
-- ============================================

-- Insertar todos los nuevos settings (solo si no existen)
INSERT INTO settings (key_name, value, description) VALUES
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

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================

