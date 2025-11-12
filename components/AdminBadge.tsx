'use client'

import { Check } from 'lucide-react'

interface AdminBadgeProps {
  username: string
  role?: 'admin' | 'mod' | 'creator'
}

export default function AdminBadge({ username, role = 'admin' }: AdminBadgeProps) {
  // Obtener lista de admins desde variable de entorno
  const adminsEnv = process.env.NEXT_PUBLIC_ADMINS || ''
  const admins = adminsEnv.split(',').map(a => a.trim().toLowerCase())
  
  // Verificar si el usuario es admin
  const isAdmin = admins.includes(username.toLowerCase())
  
  if (!isAdmin) return null

  const roleConfig = {
    admin: {
      label: 'Admin',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
    },
    mod: {
      label: 'Mod',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
    },
    creator: {
      label: 'Creador',
      bgColor: 'bg-purple-500',
      textColor: 'text-white',
    },
  }

  const config = roleConfig[role]

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${config.bgColor} ${config.textColor}`}
      title={config.label}
    >
      <Check className="w-2.5 h-2.5" />
      <span>{config.label}</span>
    </span>
  )
}

