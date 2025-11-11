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
  
  // No mostrar layout en la landing page
  const isLandingPage = pathname === '/landing'

  if (isLandingPage) {
    return <>{children}</>
  }

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>
  }

  return <ForumLayout>{children}</ForumLayout>
}

