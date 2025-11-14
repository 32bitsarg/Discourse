'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Trash2, MessageCircle, ThumbsUp, Reply, UserPlus } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Notification {
  id: number
  type: string
  content: string
  related_post_id?: number
  related_comment_id?: number
  related_user_id?: number
  related_username?: string
  related_avatar_url?: string
  read: boolean
  created_at: string
}

export default function NotificationsPanel() {
  const { user } = useUser()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      loadNotifications()
    }
  }, [user, isOpen])

  // Cargar notificaciones periódicamente si el panel está abierto
  useEffect(() => {
    if (!isOpen || !user) return

    const interval = setInterval(() => {
      loadNotifications()
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [isOpen, user])

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'PUT' })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marcando notificación:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marcando todas las notificaciones:', error)
    }
  }

  const deleteNotification = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error eliminando notificación:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reply':
      case 'comment_reply':
        return <Reply className="w-4 h-4" />
      case 'upvote':
      case 'comment_upvote':
        return <ThumbsUp className="w-4 h-4" />
      case 'mention':
        return <MessageCircle className="w-4 h-4" />
      case 'new_post':
        return <MessageCircle className="w-4 h-4" />
      case 'community_approved':
        return <UserPlus className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.related_post_id) {
      return `/post/${notification.related_post_id}`
    }
    return '/feed'
  }

  if (!user) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-xl z-50 max-h-[calc(100vh-5rem)] flex flex-col"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Notificaciones</h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Cargando notificaciones...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No tienes notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-primary-50/30' : ''
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Link
                          href={getNotificationLink(notification)}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id)
                            }
                            setIsOpen(false)
                          }}
                          className="block"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              notification.type.includes('reply') 
                                ? 'bg-blue-100 text-blue-600'
                                : notification.type.includes('upvote')
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{notification.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.created_at).toLocaleString('es-ES', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary-600 rounded-full" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

