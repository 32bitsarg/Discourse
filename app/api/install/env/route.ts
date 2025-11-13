import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { dbConfig, redisConfig } = await request.json()

    // Generar session secret
    const sessionSecret = crypto.randomBytes(32).toString('hex')

    const envContent = `# Configuración de Base de Datos
DB_HOST=${dbConfig.host}
DB_PORT=${dbConfig.port}
DB_USER=${dbConfig.user}
DB_PASSWORD=${dbConfig.password}
DB_NAME=${dbConfig.database}

# Redis (Opcional)
${redisConfig?.url ? `UPSTASH_REDIS_REST_URL=${redisConfig.url}` : '# UPSTASH_REDIS_REST_URL='}
${redisConfig?.token ? `UPSTASH_REDIS_REST_TOKEN=${redisConfig.token}` : '# UPSTASH_REDIS_REST_TOKEN='}

# Seguridad
SESSION_SECRET=${sessionSecret}

# Entorno
NODE_ENV=production
`

    const envPath = path.join(process.cwd(), '.env.local')
    
    // Escribir archivo .env.local
    fs.writeFileSync(envPath, envContent)

    return NextResponse.json({
      success: true,
      message: 'Archivo .env.local creado exitosamente',
    })
  } catch (error: any) {
    console.error('Error creando .env.local:', error)
    return NextResponse.json(
      {
        message: error.message || 'Error creando archivo .env.local',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

