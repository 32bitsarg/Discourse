// Script para migrar y agregar tablas de integración con plataformas sociales
require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function migrate() {
  console.log('=== Migrando esquema para integración con plataformas sociales ===\n')

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
    console.log('Creando tablas de integración social...\n')
    
    const createTables = [
      `CREATE TABLE IF NOT EXISTS user_platform_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_user_id VARCHAR(255),
        platform_username VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        auto_share BOOLEAN DEFAULT FALSE,
        auto_sync BOOLEAN DEFAULT FALSE,
        sync_frequency VARCHAR(20) DEFAULT 'daily',
        last_sync_at TIMESTAMP NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_platform (user_id, platform),
        INDEX idx_user (user_id),
        INDEX idx_platform (platform),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      
      `CREATE TABLE IF NOT EXISTS post_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_post_id VARCHAR(255),
        share_url VARCHAR(500),
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_post (post_id),
        INDEX idx_user (user_id),
        INDEX idx_platform (platform),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      
      `CREATE TABLE IF NOT EXISTS imported_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_content_id VARCHAR(255) NOT NULL,
        platform_content_url VARCHAR(500),
        post_id INT,
        content_type VARCHAR(50) NOT NULL,
        title TEXT,
        content TEXT,
        media_urls JSON,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_synced_at TIMESTAMP NULL,
        metadata JSON,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
        UNIQUE KEY unique_platform_content (platform, platform_content_id),
        INDEX idx_user (user_id),
        INDEX idx_platform (platform),
        INDEX idx_post (post_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ]

    for (const sql of createTables) {
      try {
        await connection.execute(sql)
        console.log('✅ Tabla creada/verificada')
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('⚠️  Tabla ya existe')
        } else {
          console.error(`❌ Error: ${error.message}`)
          throw error
        }
      }
    }

    console.log('\n✅ Migración completada exitosamente!')
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

migrate()

