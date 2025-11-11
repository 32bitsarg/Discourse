'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import MobileHeader from './MobileHeader'
import BottomNavigation from './BottomNavigation'
import FloatingActionButton from './FloatingActionButton'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname()
  const [showFAB, setShowFAB] = useState(true)

  useEffect(() => {
    // Ocultar FAB en ciertas rutas
    const hideFABRoutes = ['/post/', '/user/']
    const shouldHide = hideFABRoutes.some(route => pathname?.startsWith(route))
    setShowFAB(!shouldHide)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 safe-area-bottom">
      <MobileHeader />
      
      {/* Contenido principal con padding para header y bottom nav */}
      <main className="pt-14 pb-4 px-3 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Floating Action Button para crear post */}
      {showFAB && <FloatingActionButton />}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

