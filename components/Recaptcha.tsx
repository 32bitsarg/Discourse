'use client'

import { useEffect, useRef } from 'react'

interface RecaptchaProps {
  onVerify: (token: string) => void
  onError?: () => void
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

export default function Recaptcha({ onVerify, onError }: RecaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''
  const executedRef = useRef(false)

  useEffect(() => {
    if (!siteKey) {
      console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY no configurado')
      return
    }

    // Cargar script de reCAPTCHA
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          if (!executedRef.current) {
            executedRef.current = true
            window.grecaptcha
              .execute(siteKey, { action: 'submit' })
              .then((token) => {
                onVerify(token)
              })
              .catch((error) => {
                console.error('Error ejecutando reCAPTCHA:', error)
                if (onError) {
                  onError()
                }
              })
          }
        })
      }
    }

    script.onerror = () => {
      console.error('Error cargando reCAPTCHA')
      if (onError) {
        onError()
      }
    }

    return () => {
      // Limpiar script al desmontar
      const existingScript = document.querySelector(`script[src*="recaptcha"]`)
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [siteKey, onVerify, onError])

  // reCAPTCHA v3 es invisible, no renderiza nada
  return null
}

