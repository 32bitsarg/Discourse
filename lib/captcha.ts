/**
 * Verifica un token de reCAPTCHA v3
 */
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    // Si no hay secret key configurado, permitir (para desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  RECAPTCHA_SECRET_KEY no configurado, saltando verificación en desarrollo')
      return true
    }
    return false
  }

  if (!token) {
    return false
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()

    // reCAPTCHA v3 retorna un score de 0.0 a 1.0
    // 0.0 = bot, 1.0 = humano
    // Normalmente se acepta >= 0.5
    return data.success === true && (data.score || 0) >= 0.5
  } catch (error) {
    console.error('Error verificando reCAPTCHA:', error)
    // En caso de error, denegar por seguridad
    return false
  }
}

