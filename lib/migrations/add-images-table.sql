-- Tabla para almacenar imágenes separadas del contenido
-- Esto permite reducir significativamente el tamaño de las respuestas JSON
CREATE TABLE IF NOT EXISTS post_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NULL,
  comment_id INT NULL,
  image_data LONGBLOB NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INT,
  height INT,
  file_size INT NOT NULL,
  original_filename VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_comment (comment_id),
  INDEX idx_display_order (display_order),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL) OR (post_id IS NULL AND comment_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

