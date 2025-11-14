-- ============================================
-- MIGRACIÓN: Email Verification
-- ============================================
-- Este script agrega soporte para verificación de email
-- Ejecutar en bases de datos existentes

-- Agregar campo email_verified a tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE AFTER email;

-- Crear tabla de tokens de verificación de email
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

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================

