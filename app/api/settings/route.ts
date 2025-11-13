import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSetting, updateSetting, getAllSettings } from '@/lib/settings'

/**
 * GET - Obtener settings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (key) {
      // Obtener un setting específico
      const value = await getSetting(key)
      return NextResponse.json({ key, value })
    } else {
      // Obtener todos los settings
      const settings = await getAllSettings()
      return NextResponse.json({ settings })
    }
  } catch (error: any) {
    console.error('Error obteniendo settings:', error)
    return NextResponse.json(
      { message: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Actualizar setting
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: 401 }
      )
    }

    const { key, value, description } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { message: 'Key y value son requeridos' },
        { status: 400 }
      )
    }

    const success = await updateSetting(key, value, description)

    if (!success) {
      return NextResponse.json(
        { message: 'Error al actualizar configuración' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Configuración actualizada' })
  } catch (error: any) {
    console.error('Error actualizando setting:', error)
    return NextResponse.json(
      { message: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

