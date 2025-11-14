-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'reply', 'mention', 'upvote', 'new_post', 'community_approved', etc.
  content TEXT,
  related_post_id INT,
  related_comment_id INT,
  related_user_id INT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (related_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (read),
  INDEX idx_created (created_at),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de posts guardados
CREATE TABLE IF NOT EXISTS saved_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_post (user_id, post_id),
  INDEX idx_user (user_id),
  INDEX idx_post (post_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de posts ocultos
CREATE TABLE IF NOT EXISTS hidden_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_post (user_id, post_id),
  INDEX idx_user (user_id),
  INDEX idx_post (post_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

