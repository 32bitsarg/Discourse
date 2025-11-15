import { redirect } from 'next/navigation'
import pool from '@/lib/db'

async function checkInstallation() {
  try {
    const [tables] = await pool.execute("SHOW TABLES LIKE 'users'") as any[]
    return tables.length > 0
  } catch (error) {
    // En caso de error (BD no disponible, etc), asumir que no está instalado
    // Solo loguear en desarrollo para no exponer errores en producción
    if (process.env.NODE_ENV === 'development') {
      console.error('Error verificando instalación:', error)
    }
    return false
  }
}

export default async function Home() {
  try {
    const isInstalled = await checkInstallation()
    
    if (isInstalled) {
      // Si está instalado, redirigir directamente a landing (modo producción)
      redirect('/landing')
    }
    
    // Si no está instalado, redirigir al instalador
    // Solo en desarrollo o si realmente no está instalado
    redirect('/install')
  } catch (error) {
    // En producción, asumir que está instalado y redirigir a landing
    // Esto evita que errores temporales de BD redirijan a /install
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.NETLIFY) {
      redirect('/landing')
    } else {
      // En desarrollo, ir a install si hay error
      redirect('/install')
    }
  }
}

