import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para manejar multi-tenancy
 * Detecta el tenant basado en subdominio o dominio personalizado
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''
  const hostWithoutPort = host.split(':')[0]
  
  // Obtener dominio principal de variables de entorno o usar default
  const mainDomain = process.env.MAIN_DOMAIN || 'discourse.click'
  const isMainDomain = hostWithoutPort === mainDomain || 
                       hostWithoutPort === `www.${mainDomain}` ||
                       hostWithoutPort === 'localhost' ||
                       hostWithoutPort === '127.0.0.1'
  
  // Si es el dominio principal, NO buscar tenant - permitir todas las rutas
  if (isMainDomain) {
    // Rutas públicas del dominio principal (siempre permitidas)
    const mainDomainPublicRoutes = [
      '/api/tenants/register',
      '/api/tenants/check-slug',
      '/api/tenants/current',
      '/api/install',
      '/api/admin-saas',
      '/pricing',
      '/saas',
      '/landing',
      '/self-host',
      '/register',
      '/install',
      '/admin-saas',
      '/about',
      '/docs',
    ]
    
    // Si es ruta pública, permitir
    if (mainDomainPublicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
      return NextResponse.next()
    }
    
    // Para todas las demás rutas del dominio principal (/feed, /r, /user, etc.)
    // NO buscar tenant, usar BD principal (tu foro)
    return NextResponse.next()
  }
  
  // Si NO es el dominio principal, es un subdominio (tenant)
  const subdomain = extractSubdomain(host)
  
  if (subdomain) {
    // Es un subdominio de tenant (ej: mi-foro.discourse.click)
    // El tenant se detectará en getCurrentTenant()
    // Permitir todas las rutas, el sistema de tenant manejará el routing
    return NextResponse.next()
  }
  
  // Si no es dominio principal ni subdominio, podría ser dominio personalizado
  // Permitir acceso, getCurrentTenant() lo manejará
  return NextResponse.next()
}

/**
 * Extrae el subdominio del host
 */
function extractSubdomain(host: string): string | null {
  const hostWithoutPort = host.split(':')[0]
  
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null
  }
  
  const parts = hostWithoutPort.split('.')
  
  // Si tiene al menos 3 partes (subdomain.domain.com), retornar el subdominio
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

/**
 * Verifica si es un dominio personalizado conocido
 */
function isCustomDomain(host: string): boolean {
  // Lista de dominios principales (configurar según tu setup)
  const mainDomains = [
    'discourse.com',
    'discourse.local',
    process.env.MAIN_DOMAIN,
  ].filter(Boolean)
  
  const hostWithoutPort = host.split(':')[0]
  
  // Si el host no termina con ninguno de los dominios principales, es un dominio personalizado
  return !mainDomains.some(domain => hostWithoutPort.endsWith(domain))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

