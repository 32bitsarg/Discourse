-- ============================================
-- MIGRACIÓN: Agregar tabla settings
-- ============================================
-- Este script agrega la tabla settings y configuración inicial
-- Ejecutar en producción para actualizar la base de datos
-- ============================================

-- Crear tabla settings si no existe
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar configuración por defecto (solo si no existe)
INSERT INTO settings (key_name, value, description) VALUES
('site_name', 'Discourse', 'Nombre del sitio/foro'),
('site_description', 'Plataforma de foros y comunidades', 'Descripción del sitio')
ON DUPLICATE KEY UPDATE value=value;

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================

