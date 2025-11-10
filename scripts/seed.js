// Script para insertar datos de ejemplo
// Ejecutar: node scripts/seed.js
// Asegúrate de tener las variables de entorno configuradas

const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

async function seed() {
  // Validar que existan las variables de entorno
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('❌ Error: Faltan variables de entorno de base de datos')
    console.error('   Crea un archivo .env.local con las credenciales necesarias')
    console.error('   Puedes usar .env.example como referencia')
    process.exit(1)
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  try {
    console.log('Insertando datos de ejemplo...')

    // Hash de password para "password123"
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Insertar usuarios
    const [user1] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, karma) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=username',
      ['juan_perez', 'juan@example.com', hashedPassword, 150]
    )
    
    const [user2] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, karma) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=username',
      ['maria_garcia', 'maria@example.com', hashedPassword, 89]
    )

    // Obtener IDs de usuarios
    const [users] = await connection.execute('SELECT id, username FROM users WHERE username IN (?, ?)', ['juan_perez', 'maria_garcia'])
    const juanUser = users.find(u => u.username === 'juan_perez')
    const mariaUser = users.find(u => u.username === 'maria_garcia')
    const juanId = juanUser?.id || users[0]?.id
    const mariaId = mariaUser?.id || users[1]?.id || users[0]?.id

    // Insertar comunidades (sin category_id, como Reddit)
    const [sub1] = await connection.execute(
      'INSERT INTO subforums (creator_id, name, slug, description, member_count, post_count, is_public) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name',
      [juanId, 'Programación Web', 'programacion-web', 'Discusiones sobre desarrollo web, frameworks y tecnologías modernas', 45, 23, true]
    )

    const [sub2] = await connection.execute(
      'INSERT INTO subforums (creator_id, name, slug, description, member_count, post_count, is_public) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name',
      [mariaId, 'Diseño UI/UX', 'diseno-ui-ux', 'Comparte tus diseños, tips y recursos de diseño de interfaces', 67, 34, true]
    )

    const [sub3] = await connection.execute(
      'INSERT INTO subforums (creator_id, name, slug, description, member_count, post_count, is_public) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=name',
      [juanId, 'Proyectos Personales', 'proyectos-personales', 'Muestra tus proyectos y recibe feedback de la comunidad', 32, 18, true]
    )

    // Obtener IDs de subforos
    const [subforums] = await connection.execute('SELECT id FROM subforums WHERE slug IN (?, ?, ?)', ['programacion-web', 'diseno-ui-ux', 'proyectos-personales'])
    const progId = subforums[0]?.id
    const disenoId = subforums[1]?.id
    const proyectosId = subforums[2]?.id

    // Insertar posts
    if (progId) {
      await connection.execute(
        'INSERT INTO posts (subforum_id, author_id, title, content, upvotes, downvotes, comment_count, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [progId, juanId, '¿Cuál es el mejor framework para React en 2024?', 'Estoy empezando con React y quiero saber qué framework o librería recomiendan para el estado global y routing. ¿Next.js, Remix, o algo más?', 45, 2, 12, true]
      )

      await connection.execute(
        'INSERT INTO posts (subforum_id, author_id, title, content, upvotes, downvotes, comment_count, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [progId, mariaId, 'Guía completa de TypeScript para principiantes', 'Comparto esta guía que me ayudó mucho cuando empecé con TypeScript. Incluye ejemplos prácticos y mejores prácticas.', 89, 1, 23, false]
      )
    }

    if (disenoId) {
      await connection.execute(
        'INSERT INTO posts (subforum_id, author_id, title, content, upvotes, downvotes, comment_count, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [disenoId, mariaId, 'Paleta de colores para aplicaciones modernas', 'Aquí está mi colección de paletas de colores que uso en mis proyectos. ¿Qué opinan?', 67, 0, 15, true]
      )

      await connection.execute(
        'INSERT INTO posts (subforum_id, author_id, title, content, upvotes, downvotes, comment_count, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [disenoId, juanId, 'Herramientas gratuitas para diseño de interfaces', 'Lista de herramientas gratuitas que uso para diseñar: Figma, Canva, etc. ¿Alguna otra recomendación?', 34, 3, 8, false]
      )
    }

    if (proyectosId) {
      await connection.execute(
        'INSERT INTO posts (subforum_id, author_id, title, content, upvotes, downvotes, comment_count, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [proyectosId, juanId, 'Mi primera aplicación con Next.js', 'Comparto mi primera aplicación hecha con Next.js. Acepto feedback y sugerencias para mejorarla.', 56, 1, 18, false]
      )

      await connection.execute(
        'INSERT INTO posts (subforum_id, author_id, title, content, upvotes, downvotes, comment_count, is_hot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [proyectosId, mariaId, 'Portfolio personal - ¿Qué opinan?', 'Acabo de terminar mi portfolio personal. ¿Les gusta el diseño? ¿Algún consejo para mejorarlo?', 78, 2, 25, true]
      )
    }

    // Obtener IDs de posts para agregar comentarios
    const [posts] = await connection.execute('SELECT id, title FROM posts ORDER BY id LIMIT 6')
    const postIds = posts.map(p => p.id)

    // Insertar comentarios de ejemplo
    if (postIds.length > 0) {
      // Comentarios para el primer post (12 comentarios)
      for (let i = 0; i < 12; i++) {
        const authorId = i % 2 === 0 ? juanId : mariaId
        await connection.execute(
          'INSERT INTO comments (post_id, author_id, content, upvotes, downvotes) VALUES (?, ?, ?, ?, ?)',
          [postIds[0], authorId, `Comentario de ejemplo ${i + 1} para el post sobre frameworks React. Muy interesante la discusión.`, Math.floor(Math.random() * 10), Math.floor(Math.random() * 3)]
        )
      }

      // Comentarios para el segundo post (23 comentarios)
      for (let i = 0; i < 23; i++) {
        const authorId = i % 2 === 0 ? mariaId : juanId
        await connection.execute(
          'INSERT INTO comments (post_id, author_id, content, upvotes, downvotes) VALUES (?, ?, ?, ?, ?)',
          [postIds[1], authorId, `Comentario ${i + 1} sobre TypeScript. Excelente guía, me ayudó mucho.`, Math.floor(Math.random() * 15), Math.floor(Math.random() * 2)]
        )
      }

      // Comentarios para el tercer post (15 comentarios)
      if (postIds[2]) {
        for (let i = 0; i < 15; i++) {
          const authorId = i % 2 === 0 ? mariaId : juanId
          await connection.execute(
            'INSERT INTO comments (post_id, author_id, content, upvotes, downvotes) VALUES (?, ?, ?, ?, ?)',
            [postIds[2], authorId, `Comentario ${i + 1} sobre paletas de colores. Me encanta esta paleta.`, Math.floor(Math.random() * 8), Math.floor(Math.random() * 2)]
          )
        }
      }

      // Comentarios para el cuarto post (8 comentarios)
      if (postIds[3]) {
        for (let i = 0; i < 8; i++) {
          const authorId = i % 2 === 0 ? juanId : mariaId
          await connection.execute(
            'INSERT INTO comments (post_id, author_id, content, upvotes, downvotes) VALUES (?, ?, ?, ?, ?)',
            [postIds[3], authorId, `Comentario ${i + 1} sobre herramientas de diseño. Muy útil la lista.`, Math.floor(Math.random() * 5), Math.floor(Math.random() * 1)]
          )
        }
      }

      // Comentarios para el quinto post (18 comentarios)
      if (postIds[4]) {
        for (let i = 0; i < 18; i++) {
          const authorId = i % 2 === 0 ? juanId : mariaId
          await connection.execute(
            'INSERT INTO comments (post_id, author_id, content, upvotes, downvotes) VALUES (?, ?, ?, ?, ?)',
            [postIds[4], authorId, `Comentario ${i + 1} sobre la aplicación Next.js. Buen trabajo!`, Math.floor(Math.random() * 12), Math.floor(Math.random() * 2)]
          )
        }
      }

      // Comentarios para el sexto post (25 comentarios)
      if (postIds[5]) {
        for (let i = 0; i < 25; i++) {
          const authorId = i % 2 === 0 ? mariaId : juanId
          await connection.execute(
            'INSERT INTO comments (post_id, author_id, content, upvotes, downvotes) VALUES (?, ?, ?, ?, ?)',
            [postIds[5], authorId, `Comentario ${i + 1} sobre el portfolio. El diseño está genial!`, Math.floor(Math.random() * 20), Math.floor(Math.random() * 3)]
          )
        }
      }
    }

    // Agregar miembros a subforos
    if (progId) {
      await connection.execute(
        'INSERT INTO subforum_members (subforum_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role=role',
        [progId, juanId, 'admin']
      )
      await connection.execute(
        'INSERT INTO subforum_members (subforum_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role=role',
        [progId, mariaId, 'member']
      )
    }

    if (disenoId) {
      await connection.execute(
        'INSERT INTO subforum_members (subforum_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role=role',
        [disenoId, mariaId, 'admin']
      )
      await connection.execute(
        'INSERT INTO subforum_members (subforum_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role=role',
        [disenoId, juanId, 'member']
      )
    }

    if (proyectosId) {
      await connection.execute(
        'INSERT INTO subforum_members (subforum_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role=role',
        [proyectosId, juanId, 'admin']
      )
      await connection.execute(
        'INSERT INTO subforum_members (subforum_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role=role',
        [proyectosId, mariaId, 'member']
      )
    }

    console.log('✅ Datos de ejemplo insertados correctamente')
  } catch (error) {
    console.error('❌ Error al insertar datos:', error)
  } finally {
    await connection.end()
  }
}

seed()

