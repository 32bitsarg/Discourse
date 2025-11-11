'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar si el dispositivo es móvil o tablet
 * Considera móvil/tablet si el ancho es menor a 1024px
 */
export function useIsMobile(): boolean {
  // Inicializar con detección inmediata si estamos en el cliente
  const [isMobile, setIsMobile] = useState(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      // En SSR, asumir desktop (se corregirá en el cliente)
      return false
    }
    
    // Verificar user agent primero (más rápido y confiable)
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ''
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
    
    // Verificar ancho de pantalla
    const isMobileWidth = window.innerWidth < 1024
    
    // Es móvil si cumple cualquiera de las condiciones
    // Priorizar user agent para detección más precisa
    return isMobileUA || isMobileWidth
  })

  useEffect(() => {
    // Función para verificar si es móvil
    const checkIsMobile = () => {
      // Verificar ancho de pantalla
      const isMobileWidth = window.innerWidth < 1024
      
      // Verificar user agent como respaldo
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ''
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      
      // Es móvil si cumple cualquiera de las condiciones
      setIsMobile(isMobileWidth || (isMobileUA && window.innerWidth < 1024))
    }

    // Verificar al montar (por si acaso cambió algo)
    checkIsMobile()

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkIsMobile)

    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])

  return isMobile
}

/**
 * Hook para detectar si es tablet específicamente
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent.toLowerCase())
      
      // Tablet: entre 768px y 1023px, o user agent indica tablet
      setIsTablet((width >= 768 && width < 1024) || (isTabletUA && width < 1024))
    }

    checkIsTablet()
    window.addEventListener('resize', checkIsTablet)

    return () => {
      window.removeEventListener('resize', checkIsTablet)
    }
  }, [])

  return isTablet
}

