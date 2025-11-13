import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const {
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      dbName,
      siteName,
      adminUsername,
      adminEmail,
      adminPassword,
      redisUrl,
      redisToken,
    } = await request.json()

    // Validaciones
    if (!dbHost || !dbUser || !dbPassword || !dbName || !siteName || !adminUsername || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar contraseña
    if (adminPassword.length < 8) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Conectar a BD (ya probada y con tablas creadas)
    let connection
    try {
      connection = await mysql.createConnection({
        host: dbHost,
        port: parseInt(dbPort || '3306'),
        user: dbUser,
        password: dbPassword,
        database: dbName,
      })
    } catch (error: any) {
      return NextResponse.json(
        { message: `Error conectando a MySQL: ${error.message}` },
        { status: 400 }
      )
    }

    try {

      // Guardar configuración del sitio (nombre del foro)
      await connection.query(
        'INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
        ['site_name', siteName, 'Nombre del sitio/foro', siteName]
      )

      // Insertar todos los settings por defecto
      const defaultSettings = [
        ['site_description', 'Plataforma de foros y comunidades', 'Descripción del sitio'],
        ['site_logo', '', 'URL del logo del sitio'],
        ['site_favicon', '', 'URL del favicon'],
        ['primary_color', '#6366f1', 'Color primario del tema'],
        ['header_banner', '', 'URL del banner/header image'],
        ['meta_title', '', 'Meta title para SEO'],
        ['meta_description', '', 'Meta description para SEO'],
        ['meta_keywords', '', 'Meta keywords para SEO'],
        ['public_registration', 'true', 'Permitir registro público'],
        ['email_verification_required', 'false', 'Requiere verificación de email'],
        ['minimum_age', '13', 'Edad mínima para registrarse'],
        ['allow_custom_avatars', 'true', 'Permitir avatares personalizados'],
        ['allow_profile_banners', 'true', 'Permitir banners de perfil'],
        ['min_karma_create_community', '0', 'Karma mínimo para crear comunidades'],
        ['allow_community_creation', 'true', 'Permitir creación de comunidades'],
        ['community_approval_required', 'false', 'Requiere aprobación para nuevas comunidades'],
        ['max_post_length', '10000', 'Límite de caracteres en posts'],
        ['max_comment_length', '5000', 'Límite de caracteres en comentarios'],
        ['allow_images_in_posts', 'true', 'Permitir imágenes en posts'],
        ['allow_videos_in_posts', 'true', 'Permitir videos en posts'],
        ['allow_external_links', 'true', 'Permitir enlaces externos'],
        ['banned_words', '', 'Palabras prohibidas (separadas por comas)'],
        ['show_vote_counts', 'true', 'Mostrar contador de votos'],
        ['allow_downvotes', 'true', 'Permitir downvotes'],
        ['min_karma_to_vote', '0', 'Karma mínimo para votar'],
        ['min_karma_to_comment', '0', 'Karma mínimo para comentar'],
        ['admin_email', adminEmail, 'Email del administrador'],
        ['send_welcome_emails', 'true', 'Enviar emails de bienvenida'],
        ['send_post_notifications', 'false', 'Enviar notificaciones de nuevos posts'],
        ['google_analytics_id', '', 'Google Analytics ID'],
        ['rate_limit_per_minute', '60', 'Rate limiting (requests por minuto)'],
        ['captcha_on_registration', 'false', 'CAPTCHA en registro'],
        ['captcha_on_posts', 'false', 'CAPTCHA en posts'],
      ]

      for (const [key, value, description] of defaultSettings) {
        await connection.query(
          'INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?',
          [key, value, description, value]
        )
      }

      // Crear usuario admin
      const passwordHash = await hashPassword(adminPassword)
      await connection.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [adminUsername, adminEmail, passwordHash]
      )

      await connection.end()

      // Crear archivo .env.local automáticamente
      try {
        const envRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/install/env`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dbConfig: {
              host: dbHost,
              port: dbPort,
              user: dbUser,
              password: dbPassword,
              database: dbName,
            },
            redisConfig: redisUrl ? {
              url: redisUrl,
              token: redisToken,
            } : null,
          }),
        })

        if (!envRes.ok) {
          console.warn('No se pudo crear .env.local automáticamente')
        }
      } catch (envError) {
        console.warn('Error creando .env.local:', envError)
        // No es crítico, el usuario puede crearlo manualmente
      }

      return NextResponse.json({
        success: true,
        message: 'Instalación completada exitosamente',
        envCreated: true,
      })
    } catch (error: any) {
      await connection.end()
      throw error
    }
  } catch (error: any) {
    console.error('Error en instalación:', error)
    return NextResponse.json(
      {
        message: error.message || 'Error durante la instalación',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

function cleanSqlContent(sql: string): string[] {
  const lines = sql.split('\n')
  const cleanedLines = lines.map(line => {
    const commentIndex = line.indexOf('--')
    if (commentIndex >= 0) {
      return line.substring(0, commentIndex).trim()
    }
    return line.trim()
  }).filter(line => line.length > 0)

  const fullSql = cleanedLines.join('\n')
  const statements = fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length > 10)

  return statements
}

