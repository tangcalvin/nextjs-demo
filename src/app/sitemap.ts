import type { MetadataRoute } from 'next'

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const ROUTES = ['/users', '/contacts'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  return ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))
}


