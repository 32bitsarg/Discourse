'use client'

import { SWRConfig } from 'swr'
import { swrConfig, fetcher } from '@/lib/hooks/useSWRConfig'

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ ...swrConfig, fetcher }}>
      {children}
    </SWRConfig>
  )
}

