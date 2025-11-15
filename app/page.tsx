import { redirect } from 'next/navigation'
import pool from '@/lib/db'

async function checkInstallation() {
  try {
    const [tables] = await pool.execute("SHOW TABLES LIKE 'users'") as any[]
    return tables.length > 0
  } catch (error) {
    // En caso de error (BD no disponible, etc), asumir que no está instalado
    console.error('Error verificando instalación:', error)
    return false
  }
}

export default async function Home() {
  try {
    const isInstalled = await checkInstallation()
    
    if (!isInstalled) {
      // Si no está instalado, redirigir al instalador
      redirect('/install')
    }
    
    // Si está instalado, redirigir a la landing page (modo producción)
    redirect('/landing')
  } catch (error) {
    // Si hay un error crítico, redirigir al instalador
    console.error('Error en página principal:', error)
    redirect('/install')
  }
}

