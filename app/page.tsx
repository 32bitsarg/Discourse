import { redirect } from 'next/navigation'
import pool from '@/lib/db'

async function checkInstallation() {
  try {
    const [tables] = await pool.execute("SHOW TABLES LIKE 'users'") as any[]
    return tables.length > 0
  } catch {
    return false
  }
}

export default async function Home() {
  const isInstalled = await checkInstallation()
  
  if (!isInstalled) {
    // Si no está instalado, redirigir al instalador
    redirect('/install')
  }
  
  // Si está instalado, redirigir a la landing page
  redirect('/landing')
}

