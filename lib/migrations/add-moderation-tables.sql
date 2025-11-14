-- Tabla de bans de usuarios
CREATE TABLE IF NOT EXISTS user_bans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  banned_by INT NOT NULL,
  reason TEXT,
  expires_at TIMESTAMP NULL, -- NULL = ban permanente
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de historial de moderación
CREATE TABLE IF NOT EXISTS moderation_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moderator_id INT NOT NULL,
  target_type ENUM('post', 'comment', 'user') NOT NULL,
  target_id INT NOT NULL,
  action ENUM('delete', 'hide', 'warn', 'ban', 'unban', 'approve', 'reject') NOT NULL,
  reason TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_moderator (moderator_id),
  INDEX idx_target (target_type, target_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

