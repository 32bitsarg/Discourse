'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations } from './translations'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Detectar idioma del navegador
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language || (navigator as any).userLanguage || 'en'
      const langCode = browserLang.split('-')[0].toLowerCase()
      
      // Si el idioma es español, usar español, sino inglés
      const detectedLang: Language = langCode === 'es' ? 'es' : 'en'
      
      // Verificar si hay una preferencia guardada
      const savedLang = localStorage.getItem('language') as Language | null
      const finalLang = savedLang && (savedLang === 'en' || savedLang === 'es') ? savedLang : detectedLang
      
      setLanguageState(finalLang)
      setMounted(true)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    // Guardar preferencia en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
  }

  // Evitar flash de contenido incorrecto durante la hidratación
  if (!mounted) {
    return <>{children}</>
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

