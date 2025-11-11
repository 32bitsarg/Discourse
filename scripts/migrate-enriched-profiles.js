// Script para migrar y agregar campos de perfiles enriquecidos
require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function migrate() {
  console.log('=== Migrando esquema para perfiles enriquecidos ===\n')

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('❌ Error: Faltan variables de entorno de base de datos')
    process.exit(1)
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })

  try {
    // Agregar campos a users si no existen
    console.log('Agregando campos a tabla users...')
    const alterUsers = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500) AFTER avatar_url",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255) AFTER bio",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(100) AFTER website",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_color VARCHAR(7) DEFAULT '#6366f1' AFTER location",
    ]

    for (const sql of alterUsers) {
      try {
        await connection.execute(sql.replace('IF NOT EXISTS', ''))
        console.log(`✅ Campo agregado`)
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`⚠️  Campo ya existe`)
        } else {
          console.error(`❌ Error: ${error.message}`)
        }
      }
    }

    // Crear nuevas tablas
    console.log('\nCreando nuevas tablas...')
    
    const createTables = [
      `CREATE TABLE IF NOT EXISTS user_social_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_platform (platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS user_projects (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS user_follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_follow (follower_id, following_id),
        INDEX idx_follower (follower_id),
        INDEX idx_following (following_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS user_interests (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS user_behavior (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ]

    for (const sql of createTables) {
      try {
        await connection.execute(sql)
        const tableMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i)
        if (tableMatch) {
          console.log(`✅ Tabla creada: ${tableMatch[1]}`)
        }
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  Tabla ya existe`)
        } else {
          console.error(`❌ Error: ${error.message}`)
        }
      }
    }

    console.log('\n✅ Migración completada!')
    await connection.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    await connection.end()
    process.exit(1)
  }
}

migrate()

