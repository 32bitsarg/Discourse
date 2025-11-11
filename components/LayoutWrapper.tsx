'use client'

import { useIsMobile } from '@/hooks/useIsMobile'
import ForumLayout from './ForumLayout'
import MobileLayout from './mobile/MobileLayout'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>
  }

  return <ForumLayout>{children}</ForumLayout>
}

