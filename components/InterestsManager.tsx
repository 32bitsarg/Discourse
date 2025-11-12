'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface InterestsManagerProps {
  onSave?: (interests: Array<{ category: string; weight: number }>) => void
  initialInterests?: Array<{ category: string; weight: number }>
}

// Categorías disponibles para intereses
const AVAILABLE_CATEGORIES = [
  'Technology',
  'Science',
  'Programming',
  'Design',
  'Art',
  'Music',
  'Gaming',
  'Sports',
  'Fitness',
  'Food',
  'Travel',
  'Photography',
  'Business',
  'Education',
  'Health',
  'Fashion',
  'Movies',
  'Books',
  'Nature',
  'Politics',
  'History',
  'Philosophy',
  'DIY',
  'Crafts',
]

const CATEGORY_TRANSLATIONS: Record<string, { en: string; es: string }> = {
  Technology: { en: 'Technology', es: 'Tecnología' },
  Science: { en: 'Science', es: 'Ciencia' },
  Programming: { en: 'Programming', es: 'Programación' },
  Design: { en: 'Design', es: 'Diseño' },
  Art: { en: 'Art', es: 'Arte' },
  Music: { en: 'Music', es: 'Música' },
  Gaming: { en: 'Gaming', es: 'Videojuegos' },
  Sports: { en: 'Sports', es: 'Deportes' },
  Fitness: { en: 'Fitness', es: 'Fitness' },
  Food: { en: 'Food', es: 'Comida' },
  Travel: { en: 'Travel', es: 'Viajes' },
  Photography: { en: 'Photography', es: 'Fotografía' },
  Business: { en: 'Business', es: 'Negocios' },
  Education: { en: 'Education', es: 'Educación' },
  Health: { en: 'Health', es: 'Salud' },
  Fashion: { en: 'Fashion', es: 'Moda' },
  Movies: { en: 'Movies', es: 'Películas' },
  Books: { en: 'Books', es: 'Libros' },
  Nature: { en: 'Nature', es: 'Naturaleza' },
  Politics: { en: 'Politics', es: 'Política' },
  History: { en: 'History', es: 'Historia' },
  Philosophy: { en: 'Philosophy', es: 'Filosofía' },
  DIY: { en: 'DIY', es: 'Bricolaje' },
  Crafts: { en: 'Crafts', es: 'Manualidades' },
}

export default function InterestsManager({ onSave, initialInterests = [] }: InterestsManagerProps) {
  const { t, language } = useI18n()
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    new Set(initialInterests.map(i => i.category))
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Cargar intereses actuales del usuario
    fetch('/api/user/interests')
      .then(res => res.json())
      .then(data => {
        if (data.interests && Array.isArray(data.interests)) {
          setSelectedInterests(new Set(data.interests.map((i: any) => i.category)))
        }
      })
      .catch(() => {
      })
  }, [])

  const toggleInterest = (category: string) => {
    const newSelected = new Set(selectedInterests)
    if (newSelected.has(category)) {
      newSelected.delete(category)
    } else {
      newSelected.add(category)
    }
    setSelectedInterests(newSelected)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const interests = Array.from(selectedInterests).map(category => ({
        category,
        weight: 1.0,
      }))

      const res = await fetch('/api/user/interests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests }),
      })

      if (res.ok) {
        if (onSave) {
          onSave(interests)
        }
      } else {
        alert(t.common.error)
      }
    } catch (error) {
      alert(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryLabel = (category: string): string => {
    const translation = CATEGORY_TRANSLATIONS[category]
    if (!translation) return category
    return language === 'es' ? translation.es : translation.en
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {t.user.selectInterests}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t.user.interestsDescription}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {AVAILABLE_CATEGORIES.map(category => {
          const isSelected = selectedInterests.has(category)
          return (
            <button
              key={category}
              onClick={() => toggleInterest(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isSelected
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isSelected && <Check className="w-4 h-4" />}
              <span>{getCategoryLabel(category)}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-600">
          {selectedInterests.size} {t.user.interests.toLowerCase()} {selectedInterests.size !== 1 ? (language === 'es' ? 'seleccionados' : 'selected') : ''}
        </p>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t.common.loading : t.common.save}
        </button>
      </div>
    </div>
  )
}

