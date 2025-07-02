import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'
  const currentDate = new Date().toISOString()

  // 静态页面配置
  const staticPages = [
    {
      url: '',
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: '/login',
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: '/register',
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8
    },
    {
      url: '/practice',
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: '/exams',
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: '/wrong-questions',
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8
    },
    {
      url: '/forgot-password',
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3
    }
  ]

  // 生成XML内容
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
