import { getCurrentUser } from './auth'

/**
 * Verifica si el usuario actual es admin basado en NEXT_PUBLIC_ADMINS
 * NEXT_PUBLIC_ADMINS puede contener IDs numéricos o usernames separados por comas
 * Ejemplo: NEXT_PUBLIC_ADMINS=1,2,3 o NEXT_PUBLIC_ADMINS=admin,32BITS
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return false
    }

    const adminIds = process.env.NEXT_PUBLIC_ADMINS
    if (!adminIds) {
      return false
    }

    const identifiers = adminIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
    
    // Verificar por ID o username
    for (const identifier of identifiers) {
      // Si es numérico, comparar con ID
      const numId = parseInt(identifier)
      if (!isNaN(numId) && numId === user.id) {
        return true
      }
      // Si no es numérico o no coincide, comparar con username
      if (identifier.toLowerCase() === user.username.toLowerCase()) {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('Error verificando admin:', error)
    return false
  }
}

/**
 * Obtiene el usuario admin actual si tiene acceso
 */
export async function getAdminUser() {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const hasAccess = await isAdmin()
  if (!hasAccess) {
    return null
  }

  return user
}

