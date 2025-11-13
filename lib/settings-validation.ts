import { getSetting } from './settings'

/**
 * Verifica si el registro público está habilitado
 */
export async function isPublicRegistrationEnabled(): Promise<boolean> {
  const value = await getSetting('public_registration')
  return value === 'true'
}

/**
 * Verifica si se requiere verificación de email
 */
export async function isEmailVerificationRequired(): Promise<boolean> {
  const value = await getSetting('email_verification_required')
  return value === 'true'
}

/**
 * Obtiene la edad mínima para registrarse
 */
export async function getMinimumAge(): Promise<number> {
  const value = await getSetting('minimum_age')
  return parseInt(value || '13', 10)
}

/**
 * Verifica si se permite la creación de comunidades
 */
export async function isCommunityCreationAllowed(): Promise<boolean> {
  const value = await getSetting('allow_community_creation')
  return value === 'true'
}

/**
 * Verifica si se requiere aprobación para nuevas comunidades
 */
export async function isCommunityApprovalRequired(): Promise<boolean> {
  const value = await getSetting('community_approval_required')
  return value === 'true'
}

/**
 * Obtiene el karma mínimo para crear comunidades
 */
export async function getMinKarmaForCommunity(): Promise<number> {
  const value = await getSetting('min_karma_create_community')
  return parseInt(value || '0', 10)
}

/**
 * Obtiene el límite máximo de caracteres para posts
 */
export async function getMaxPostLength(): Promise<number> {
  const value = await getSetting('max_post_length')
  return parseInt(value || '10000', 10)
}

/**
 * Obtiene el límite máximo de caracteres para comentarios
 */
export async function getMaxCommentLength(): Promise<number> {
  const value = await getSetting('max_comment_length')
  return parseInt(value || '5000', 10)
}

/**
 * Verifica si se permiten imágenes en posts
 */
export async function areImagesAllowedInPosts(): Promise<boolean> {
  const value = await getSetting('allow_images_in_posts')
  return value === 'true'
}

/**
 * Verifica si se permiten videos en posts
 */
export async function areVideosAllowedInPosts(): Promise<boolean> {
  const value = await getSetting('allow_videos_in_posts')
  return value === 'true'
}

/**
 * Verifica si se permiten enlaces externos
 */
export async function areExternalLinksAllowed(): Promise<boolean> {
  const value = await getSetting('allow_external_links')
  return value === 'true'
}

/**
 * Obtiene la lista de palabras prohibidas
 */
export async function getBannedWords(): Promise<string[]> {
  const value = await getSetting('banned_words')
  if (!value) return []
  return value.split(',').map(word => word.trim().toLowerCase()).filter(word => word.length > 0)
}

/**
 * Verifica si el contenido contiene palabras prohibidas
 */
export async function containsBannedWords(content: string): Promise<boolean> {
  const bannedWords = await getBannedWords()
  if (bannedWords.length === 0) return false
  
  const lowerContent = content.toLowerCase()
  return bannedWords.some(word => lowerContent.includes(word))
}

/**
 * Verifica si se muestran los contadores de votos
 */
export async function shouldShowVoteCounts(): Promise<boolean> {
  const value = await getSetting('show_vote_counts')
  return value === 'true'
}

/**
 * Verifica si se permiten downvotes
 */
export async function areDownvotesAllowed(): Promise<boolean> {
  const value = await getSetting('allow_downvotes')
  return value === 'true'
}

/**
 * Obtiene el karma mínimo para votar
 */
export async function getMinKarmaToVote(): Promise<number> {
  const value = await getSetting('min_karma_to_vote')
  return parseInt(value || '0', 10)
}

/**
 * Obtiene el karma mínimo para comentar
 */
export async function getMinKarmaToComment(): Promise<number> {
  const value = await getSetting('min_karma_to_comment')
  return parseInt(value || '0', 10)
}

/**
 * Verifica si se requiere CAPTCHA en registro
 */
export async function isCaptchaRequiredOnRegistration(): Promise<boolean> {
  const value = await getSetting('captcha_on_registration')
  return value === 'true'
}

/**
 * Verifica si se requiere CAPTCHA en posts
 */
export async function isCaptchaRequiredOnPosts(): Promise<boolean> {
  const value = await getSetting('captcha_on_posts')
  return value === 'true'
}

