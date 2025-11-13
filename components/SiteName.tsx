import { getSiteName } from '@/lib/settings'

export async function SiteName() {
  const siteName = await getSiteName()
  
  return (
    <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-primary-500 bg-clip-text text-transparent">
      {siteName}
    </span>
  )
}

