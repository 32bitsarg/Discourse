'use client'

import { ReactNode } from 'react'
import MobileHeader from './MobileHeader'
import BottomNavigation from './BottomNavigation'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 safe-area-bottom overflow-x-hidden lg:hidden">
      <MobileHeader />
      
      {/* Contenido principal con padding para header y bottom nav */}
      <main className="pt-14 pb-4 px-3 sm:px-4 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

