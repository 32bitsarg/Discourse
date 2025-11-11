'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

interface ForumLayoutProps {
  children: ReactNode
}

export default function ForumLayout({ children }: ForumLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-16 sm:pt-20 pb-6 sm:pb-8">
        {/* Sidebar - Izquierda (oculto en móviles) */}
        <aside className="hidden lg:block w-64 xl:w-80 flex-shrink-0 mr-4 xl:mr-6">
          <Sidebar />
        </aside>
        
        {/* Main Content - Derecha */}
        <main className="flex-1 w-full max-w-3xl mx-auto lg:mx-0">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}

