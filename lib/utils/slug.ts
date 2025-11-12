export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

export async function ensureUniqueSlug(
  slug: string,
  checkFunction: (slug: string) => Promise<boolean>,
  maxAttempts: number = 100
): Promise<string> {
  let finalSlug = slug
  let counter = 1

  while (counter < maxAttempts) {
    const exists = await checkFunction(finalSlug)
    if (!exists) {
      return finalSlug
    }
    finalSlug = `${slug}-${counter}`
    counter++
  }

  return `${slug}-${Date.now()}`
}

