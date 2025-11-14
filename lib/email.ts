/**
 * Sistema de envío de emails básico
 * Usa variables de entorno para configuración SMTP
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  const options: EmailOptions = { to, subject, html, text }
  return await sendEmailOptions(options)
}

async function sendEmailOptions(options: EmailOptions): Promise<boolean> {
  try {
    // Verificar si hay configuración SMTP
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM || smtpUser

    // Si no hay configuración SMTP, usar API de Resend (recomendado para producción)
    const resendApiKey = process.env.RESEND_API_KEY

    if (resendApiKey) {
      // Usar Resend API
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: smtpFrom || 'noreply@discourse.click',
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        console.error('Error enviando email con Resend:', error)
        return false
      }

      return true
    } else if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      // Usar SMTP directo (requiere nodemailer)
      // Por ahora, solo loguear en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email simulado (desarrollo):', {
          to: options.to,
          subject: options.subject,
        })
        return true
      }
      
      // En producción, aquí se implementaría nodemailer
      console.warn('SMTP configurado pero nodemailer no implementado. Usa RESEND_API_KEY para producción.')
      return false
    } else {
      // Sin configuración de email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email simulado (sin configuración):', {
          to: options.to,
          subject: options.subject,
        })
        return true
      }
      
      console.warn('No hay configuración de email. Los emails no se enviarán.')
      return false
    }
  } catch (error) {
    console.error('Error enviando email:', error)
    return false
  }
}

export async function sendWelcomeEmail(userEmail: string, username: string): Promise<boolean> {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Discourse'
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a ${siteName}!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${username}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            ¡Gracias por unirte a nuestra comunidad! Estamos emocionados de tenerte aquí.
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Puedes empezar explorando las comunidades, creando posts y participando en las discusiones.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Ir al Feed
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
            ¡Que disfrutes tu experiencia en ${siteName}!
          </p>
        </div>
      </body>
    </html>
  `

  return await sendEmailOptions({
    to: userEmail,
    subject: `¡Bienvenido a ${siteName}!`,
    html,
  })
}

export async function sendPostNotificationEmail(
  userEmail: string,
  username: string,
  postTitle: string,
  postUrl: string,
  authorUsername: string
): Promise<boolean> {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Discourse'
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Nuevo post en ${siteName}</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${username}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${authorUsername}</strong> ha publicado un nuevo post:
          </p>
          <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #333;">${postTitle}</h2>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${postUrl}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Ver Post
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Puedes desactivar estas notificaciones en tu perfil.
          </p>
        </div>
      </body>
    </html>
  `

  return await sendEmailOptions({
    to: userEmail,
    subject: `Nuevo post: ${postTitle}`,
    html,
  })
}

