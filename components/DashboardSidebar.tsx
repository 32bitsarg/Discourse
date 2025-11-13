'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  Globe,
  Palette,
  Users,
  FileText,
  ThumbsUp,
  Mail,
  Search,
  Lock,
  Home,
  ChevronRight,
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: typeof Settings
  section?: string
}

const sidebarItems: SidebarItem[] = [
  { id: 'general', label: 'General', icon: Globe, section: 'general' },
  { id: 'appearance', label: 'Apariencia', icon: Palette, section: 'appearance' },
  { id: 'users', label: 'Usuarios', icon: Users, section: 'users' },
  { id: 'content', label: 'Contenido', icon: FileText, section: 'content' },
  { id: 'voting', label: 'Votación', icon: ThumbsUp, section: 'voting' },
  { id: 'email', label: 'Email', icon: Mail, section: 'email' },
  { id: 'seo', label: 'SEO', icon: Search, section: 'seo' },
  { id: 'security', label: 'Seguridad', icon: Lock, section: 'security' },
]

interface DashboardSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function DashboardSidebar({ activeSection, onSectionChange }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 pt-16 overflow-y-auto z-40 hidden lg:block">
      <div className="p-4">
        {/* Logo/Brand */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <Link href="/feed" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.section

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.section || item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-600" />}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/feed"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Volver al Foro</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}

