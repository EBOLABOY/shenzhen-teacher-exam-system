import { Metadata } from 'next'

// SEO配置接口
interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  noindex?: boolean
  ogImage?: string
  ogType?: 'website' | 'article'
}

// 基础SEO配置
const baseSEO = {
  siteName: '深圳教师考编练习系统',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com',
  defaultImage: '/icons/icon-512x512.png',
  twitterHandle: '@teacher_exam_sz'
}

// 生成完整的SEO metadata
export function generateSEO(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noindex = false,
    ogImage,
    ogType = 'website'
  } = config

  const fullTitle = title.includes(baseSEO.siteName)
    ? title
    : `${title} - ${baseSEO.siteName}`

  const canonicalUrl = canonical
    ? `${baseSEO.siteUrl}${canonical}`
    : undefined

  // 生成动态OG图片URL
  const imageUrl = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${baseSEO.siteUrl}${ogImage}`)
    : `${baseSEO.siteUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: baseSEO.siteName }],
    creator: baseSEO.siteName,
    publisher: baseSEO.siteName,
    robots: noindex ? 'noindex,nofollow' : 'index,follow',
    alternates: canonical ? { canonical: canonicalUrl } : undefined,
    
    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: baseSEO.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale: 'zh_CN',
      type: ogType
    },

    // Twitter Cards
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: baseSEO.twitterHandle
    },

    // 其他meta标签
    other: {
      'baidu-site-verification': process.env.NEXT_PUBLIC_BAIDU_VERIFICATION || '',
      'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || ''
    }
  }
}

// 页面SEO配置
export const pageSEO = {
  home: {
    title: '深圳教师考编练习系统 - AI智能刷题平台',
    description: '专业的深圳教师考编题库练习系统，提供历年真题、模拟考试、AI智能错题分析等功能。助您高效备考，顺利通过深圳教师考编考试。',
    keywords: ['深圳教师考编', '教师资格证', '题库练习', '错题复习', '模拟考试', 'AI分析', '深圳教师招聘', '教师考试'],
    canonical: '/'
  },
  
  login: {
    title: '用户登录',
    description: '登录深圳教师考编练习系统，开始您的备考之旅。支持邮箱登录，安全便捷。',
    keywords: ['登录', '用户登录', '深圳教师考编登录'],
    canonical: '/login'
  },

  register: {
    title: '用户注册',
    description: '注册深圳教师考编练习系统账号，免费使用专业题库和AI分析功能。需要邀请码注册。',
    keywords: ['注册', '用户注册', '深圳教师考编注册', '邀请码'],
    canonical: '/register'
  },

  practice: {
    title: '随机刷题练习',
    description: '深圳教师考编随机刷题练习，涵盖教育学、心理学、教育法规等各个科目。智能推荐，高效备考。',
    keywords: ['刷题练习', '随机练习', '教师考编练习', '题库练习', '深圳教师考试'],
    canonical: '/practice'
  },

  exams: {
    title: '模拟考试中心',
    description: '深圳教师考编模拟考试，包含历年真题和预测试卷。真实考试环境，全面检验学习成果。',
    keywords: ['模拟考试', '真题考试', '预测考试', '深圳教师考编真题', '考试中心'],
    canonical: '/exams'
  },

  wrongQuestions: {
    title: 'AI错题分析',
    description: '智能错题本，AI分析薄弱知识点，提供个性化学习建议。让错题变成提分利器。',
    keywords: ['错题本', 'AI分析', '错题复习', '知识点分析', '个性化学习'],
    canonical: '/wrong-questions'
  }
}

// 生成结构化数据
export function generateStructuredData(type: 'website' | 'organization' | 'educationalOrganization') {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type === 'website' ? 'WebSite' : type === 'organization' ? 'Organization' : 'EducationalOrganization',
    name: baseSEO.siteName,
    url: baseSEO.siteUrl,
    description: '专业的深圳教师考编题库练习系统，提供AI智能分析和个性化学习方案',
    image: `${baseSEO.siteUrl}${baseSEO.defaultImage}`
  }

  if (type === 'website') {
    return {
      ...baseData,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseSEO.siteUrl}/practice?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  }

  if (type === 'educationalOrganization') {
    return {
      ...baseData,
      educationalCredentialAwarded: '教师资格证备考支持',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: '教师考编练习服务',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Course',
              name: '深圳教师考编题库练习',
              description: '包含历年真题、模拟考试、错题分析等功能'
            }
          }
        ]
      }
    }
  }

  return baseData
}
