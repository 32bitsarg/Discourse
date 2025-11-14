import pool from './db'
import crypto from 'crypto'
import { sendEmail } from './email'

/**
 * Genera un token único para verificación de email
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Crea un token de verificación de email para un usuario
 */
export async function createVerificationToken(userId: number, email: string): Promise<string> {
  // Eliminar tokens expirados del usuario
  await pool.execute(
    'DELETE FROM email_verification_tokens WHERE user_id = ? AND expires_at < NOW()',
    [userId]
  )

  // Generar nuevo token
  const token = generateVerificationToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // Expira en 24 horas

  // Guardar token
  await pool.execute(
    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  )

  // Enviar email de verificación
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`

  const subject = 'Verifica tu email - Discourse'
  const html = `
    <h1>¡Bienvenido a Discourse!</h1>
    <p>Gracias por registrarte. Para completar tu registro, por favor verifica tu dirección de email haciendo clic en el siguiente enlace:</p>
    <p><a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Verificar Email</a></p>
    <p>O copia y pega este enlace en tu navegador:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>Este enlace expirará en 24 horas.</p>
    <p>Si no creaste una cuenta, puedes ignorar este email.</p>
    <p>Saludos,<br>El equipo de Discourse</p>
  `
  const text = `¡Bienvenido a Discourse!\n\nGracias por registrarte. Para completar tu registro, por favor verifica tu dirección de email visitando:\n${verificationUrl}\n\nEste enlace expirará en 24 horas.\n\nSi no creaste una cuenta, puedes ignorar este email.\n\nSaludos,\nEl equipo de Discourse`

  try {
    await sendEmail(email, subject, html, text)
  } catch (error) {
    console.error('Error enviando email de verificación:', error)
    // No fallar el registro si el email falla, el usuario puede solicitar reenvío
  }

  return token
}

/**
 * Verifica un token de verificación de email
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; userId?: number; message: string }> {
  // Buscar token
  const [tokens] = await pool.execute(
    'SELECT user_id, expires_at FROM email_verification_tokens WHERE token = ?',
    [token]
  ) as any[]

  if (tokens.length === 0) {
    return { success: false, message: 'Token inválido' }
  }

  const tokenData = tokens[0]

  // Verificar si expiró
  const expiresAt = new Date(tokenData.expires_at)
  if (expiresAt < new Date()) {
    // Eliminar token expirado
    await pool.execute('DELETE FROM email_verification_tokens WHERE token = ?', [token])
    return { success: false, message: 'El token ha expirado. Por favor solicita uno nuevo.' }
  }

  // Marcar email como verificado
  await pool.execute(
    'UPDATE users SET email_verified = TRUE WHERE id = ?',
    [tokenData.user_id]
  )

  // Eliminar token usado
  await pool.execute('DELETE FROM email_verification_tokens WHERE token = ?', [token])

  return { success: true, userId: tokenData.user_id, message: 'Email verificado exitosamente' }
}

/**
 * Reenvía el email de verificación
 */
export async function resendVerificationEmail(userId: number): Promise<{ success: boolean; message: string }> {
  // Obtener email del usuario
  const [users] = await pool.execute(
    'SELECT email, email_verified FROM users WHERE id = ?',
    [userId]
  ) as any[]

  if (users.length === 0) {
    return { success: false, message: 'Usuario no encontrado' }
  }

  const user = users[0]

  if (user.email_verified) {
    return { success: false, message: 'El email ya está verificado' }
  }

  // Crear nuevo token
  await createVerificationToken(userId, user.email)

  return { success: true, message: 'Email de verificación reenviado' }
}

