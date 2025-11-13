'use client'

import { usePathname } from 'next/navigation'
import { useIsMobile } from '@/hooks/useIsMobile'
import ForumLayout from './ForumLayout'
import MobileLayout from './mobile/MobileLayout'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  
  // Páginas independientes que no usan el layout del foro
  const independentPages = ['/landing', '/saas', '/self-host', '/install', '/dashboard']

  if (independentPages.includes(pathname)) {
    return <>{children}</>
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>
  }

  return <ForumLayout>{children}</ForumLayout>
}

