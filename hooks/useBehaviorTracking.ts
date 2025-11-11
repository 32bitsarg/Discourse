'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TrackBehaviorOptions {
  postId?: number
  actionType: 'view' | 'vote' | 'comment' | 'click' | 'share' | 'save'
  durationSeconds?: number
  metadata?: Record<string, any>
}

interface QueuedEvent extends TrackBehaviorOptions {
  timestamp: number
  id: string
}

// Configuración de batching
const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 10, // Máximo de eventos por batch
  BATCH_INTERVAL: 30000, // 30 segundos
  PRIORITY_ACTIONS: ['vote', 'comment', 'share', 'save'], // Acciones prioritarias
  VIEW_THROTTLE: 15000, // Solo trackear views cada 15 segundos por post
}

// Storage key para eventos pendientes
const STORAGE_KEY = 'discourse_behavior_queue'

class BehaviorTracker {
  private queue: QueuedEvent[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private lastViewTimes: Map<number, number> = new Map()
  private isProcessing = false

  constructor() {
    // Cargar eventos pendientes de localStorage al iniciar
    this.loadFromStorage()
    
    // Procesar eventos pendientes al iniciar
    if (this.queue.length > 0) {
      this.processBatch()
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const events = JSON.parse(stored) as QueuedEvent[]
        // Solo mantener eventos de las últimas 24 horas
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        this.queue = events.filter(e => e.timestamp > oneDayAgo)
        if (this.queue.length !== events.length) {
          this.saveToStorage()
        }
      }
    } catch (error) {
      console.debug('Error loading behavior queue from storage:', error)
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      console.debug('Error saving behavior queue to storage:', error)
    }
  }

  private shouldThrottleView(event: QueuedEvent): boolean {
    if (event.actionType !== 'view' || !event.postId) return false
    
    const lastTime = this.lastViewTimes.get(event.postId)
    const now = Date.now()
    
    if (lastTime && (now - lastTime) < BATCH_CONFIG.VIEW_THROTTLE) {
      return true // Throttle: muy pronto desde la última view
    }
    
    this.lastViewTimes.set(event.postId, now)
    return false
  }

  addEvent(event: TrackBehaviorOptions) {
    // Throttle views muy frecuentes
    if (this.shouldThrottleView(event as QueuedEvent)) {
      return
    }

    const queuedEvent: QueuedEvent = {
      ...event,
      timestamp: Date.now(),
      id: `${Date.now()}-${Math.random()}`,
    }

    // Si es una acción prioritaria, agregar al inicio de la cola
    if (BATCH_CONFIG.PRIORITY_ACTIONS.includes(event.actionType)) {
      this.queue.unshift(queuedEvent)
    } else {
      this.queue.push(queuedEvent)
    }

    this.saveToStorage()

    // Si alcanzamos el tamaño máximo, procesar inmediatamente
    if (this.queue.length >= BATCH_CONFIG.MAX_BATCH_SIZE) {
      this.processBatch()
      return
    }

    // Iniciar timer si no existe
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch()
      }, BATCH_CONFIG.BATCH_INTERVAL)
    }
  }

  private async processBatch() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    // Limpiar timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    // Tomar hasta MAX_BATCH_SIZE eventos
    const batch = this.queue.splice(0, BATCH_CONFIG.MAX_BATCH_SIZE)
    this.saveToStorage()

    try {
      // Verificar si hay usuario logueado
      const meRes = await fetch('/api/auth/me')
      const meData = await meRes.json()
      
      if (!meData.user) {
        // No hay usuario, mantener eventos en cola
        this.queue.unshift(...batch)
        this.saveToStorage()
        this.isProcessing = false
        return
      }

      // Enviar batch al servidor
      const res = await fetch('/api/user/behavior/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      })

      if (!res.ok) {
        // Error: volver a poner eventos en cola (solo los últimos 50 para evitar overflow)
        const toRequeue = batch.slice(-50)
        this.queue.unshift(...toRequeue)
        this.saveToStorage()
      }
    } catch (error) {
      // Error de red: volver a poner eventos en cola
      const toRequeue = batch.slice(-50)
      this.queue.unshift(...toRequeue)
      this.saveToStorage()
      console.debug('Error sending behavior batch:', error)
    } finally {
      this.isProcessing = false

      // Si quedan eventos, programar siguiente batch
      if (this.queue.length > 0) {
        this.batchTimer = setTimeout(() => {
          this.processBatch()
        }, BATCH_CONFIG.BATCH_INTERVAL)
      }
    }
  }

  // Forzar procesamiento inmediato (útil para acciones importantes)
  async flush() {
    if (this.queue.length > 0) {
      await this.processBatch()
    }
  }
}

// Instancia singleton del tracker
const tracker = new BehaviorTracker()

// Limpiar eventos antiguos periódicamente
if (typeof window !== 'undefined') {
  setInterval(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const events = JSON.parse(stored) as QueuedEvent[]
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        const filtered = events.filter(e => e.timestamp > oneDayAgo)
        if (filtered.length !== events.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        }
      }
    } catch (error) {
      console.debug('Error cleaning old events:', error)
    }
  }, 60 * 60 * 1000) // Cada hora
}

export function useBehaviorTracking() {
  const trackBehavior = useCallback((options: TrackBehaviorOptions) => {
    tracker.addEvent(options)
  }, [])

  const flushTracking = useCallback(() => {
    return tracker.flush()
  }, [])

  return { trackBehavior, flushTracking }
}

// Hook para trackear tiempo de visualización de un post (optimizado)
export function useViewTracking(postId: number | undefined) {
  const startTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTrackedRef = useRef<number>(0)
  const { trackBehavior } = useBehaviorTracking()

  useEffect(() => {
    if (!postId) return

    startTimeRef.current = Date.now()
    lastTrackedRef.current = Date.now()

    // Trackear view inicial
    trackBehavior({
      postId,
      actionType: 'view',
    })

    // Trackear duración cada 30 segundos (reducido de 10)
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const now = Date.now()
        const duration = Math.floor((now - startTimeRef.current) / 1000)
        
        // Solo trackear si han pasado al menos 30 segundos desde el último tracking
        if (duration >= 30 && (now - lastTrackedRef.current) >= 30000) {
          trackBehavior({
            postId,
            actionType: 'view',
            durationSeconds: duration,
          })
          lastTrackedRef.current = now
        }
      }
    }, 30000) // Cada 30 segundos

    // Trackear duración final al desmontar (solo si fue significativa: > 10 segundos)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (startTimeRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        if (duration >= 10) {
          trackBehavior({
            postId,
            actionType: 'view',
            durationSeconds: duration,
            metadata: { final: true },
          })
        }
      }
    }
  }, [postId, trackBehavior])
}
