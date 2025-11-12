const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function migrate() {
  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    console.log('Conectado a la base de datos')

    // Función para generar slug desde título
    function generateSlug(title) {
      return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100)
    }

    // Verificar si la columna slug existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'posts' 
      AND COLUMN_NAME = 'slug'
    `, [process.env.DB_NAME])

    if (columns.length === 0) {
      console.log('Agregando columna slug a la tabla posts...')
      await connection.execute(`
        ALTER TABLE posts 
        ADD COLUMN slug VARCHAR(255) NULL AFTER title
      `)
      console.log('Columna slug agregada')
    } else {
      console.log('La columna slug ya existe')
    }

    // Agregar índice único para slug
    try {
      await connection.execute(`
        ALTER TABLE posts 
        ADD UNIQUE INDEX idx_slug (slug)
      `)
      console.log('Índice único agregado para slug')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('El índice para slug ya existe')
      } else {
        throw error
      }
    }

    // Generar slugs para posts existentes
    console.log('Generando slugs para posts existentes...')
    const [posts] = await connection.execute(`
      SELECT id, title, slug 
      FROM posts 
      WHERE slug IS NULL OR slug = ''
    `)

    console.log(`Encontrados ${posts.length} posts sin slug`)

    for (const post of posts) {
      let baseSlug = generateSlug(post.title)
      let slug = baseSlug
      let counter = 1

      // Verificar unicidad del slug
      while (true) {
        const [existing] = await connection.execute(
          'SELECT id FROM posts WHERE slug = ? AND id != ?',
          [slug, post.id]
        )

        if (existing.length === 0) {
          break
        }

        slug = `${baseSlug}-${counter}`
        counter++
      }

      await connection.execute(
        'UPDATE posts SET slug = ? WHERE id = ?',
        [slug, post.id]
      )
    }

    console.log(`Slugs generados para ${posts.length} posts`)

    console.log('Migración completada exitosamente')
  } catch (error) {
    console.error('Error en la migración:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

migrate()

