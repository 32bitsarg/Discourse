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
      <div className="flex max-w-7xl mx-auto px-4 pt-20 pb-8">
        {/* Sidebar - Izquierda */}
        <aside className="hidden lg:block w-80 flex-shrink-0 mr-6">
          <Sidebar />
        </aside>
        
        {/* Main Content - Derecha */}
        <main className="flex-1 max-w-3xl">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}

