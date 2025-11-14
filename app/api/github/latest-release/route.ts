import { NextRequest, NextResponse } from 'next/server'

/**
 * API route para obtener el último release de GitHub
 * Usa la API pública de GitHub para obtener el tag más reciente
 */
export async function GET(request: NextRequest) {
  try {
    const githubRepo = process.env.GITHUB_REPO || 'tu-usuario/discourse'
    
    // Obtener el último release de GitHub
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Discourse-App',
        },
        next: { revalidate: 3600 }, // Cache por 1 hora
      }
    )

    if (!response.ok) {
      // Si no hay releases, intentar obtener el último tag
      const tagsResponse = await fetch(
        `https://api.github.com/repos/${githubRepo}/tags`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Discourse-App',
          },
          next: { revalidate: 3600 },
        }
      )

      if (!tagsResponse.ok) {
        throw new Error('No se pudo obtener información de GitHub')
      }

      const tags = await tagsResponse.json()
      if (tags.length === 0) {
        return NextResponse.json({
          tag: null,
          version: null,
          downloadUrl: null,
          zipUrl: null,
          tarballUrl: null,
          available: false,
          message: 'Estamos trabajando en la próxima versión',
        })
      }

      const latestTag = tags[0]
      return NextResponse.json({
        tag: latestTag.name,
        version: latestTag.name.replace(/^v/, ''), // Remover 'v' si existe
        downloadUrl: `https://github.com/${githubRepo}/archive/refs/tags/${latestTag.name}.zip`,
        zipUrl: `https://github.com/${githubRepo}/archive/refs/tags/${latestTag.name}.zip`,
        tarballUrl: `https://github.com/${githubRepo}/archive/refs/tags/${latestTag.name}.tar.gz`,
        available: true,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'CDN-Cache-Control': 'public, s-maxage=7200',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=7200',
        },
      })
    }

    const release = await response.json()

    // Caché HTTP agresivo para releases de GitHub (cambian raramente)
    return NextResponse.json({
      tag: release.tag_name,
      version: release.tag_name.replace(/^v/, ''), // Remover 'v' si existe
      name: release.name,
      body: release.body,
      publishedAt: release.published_at,
      downloadUrl: `https://github.com/${githubRepo}/archive/refs/tags/${release.tag_name}.zip`,
      zipUrl: `https://github.com/${githubRepo}/archive/refs/tags/${release.tag_name}.zip`,
      tarballUrl: `https://github.com/${githubRepo}/archive/refs/tags/${release.tag_name}.tar.gz`,
      htmlUrl: release.html_url,
      available: true,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, s-maxage=7200',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=7200',
      },
    })
  } catch (error: any) {
    console.error('Error obteniendo release de GitHub:', error)
    
    // Si hay error, indicar que no hay versión disponible
    return NextResponse.json({
      tag: null,
      version: null,
      downloadUrl: null,
      zipUrl: null,
      tarballUrl: null,
      available: false,
      message: 'Estamos trabajando en la próxima versión',
      error: error.message,
    })
  }
}

