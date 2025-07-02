interface StructuredDataProps {
  data: object
}

export default function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  )
}

// 常用的结构化数据模板
export const structuredDataTemplates = {
  // 问答页面结构化数据
  qaPage: (question: string, answer: string) => ({
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: question,
      text: question,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer
      }
    }
  }),

  // 教育课程结构化数据
  course: (title: string, description: string, provider: string) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description: description,
    provider: {
      '@type': 'Organization',
      name: provider
    },
    educationalLevel: '成人教育',
    teaches: '教师考编知识',
    courseMode: '在线学习'
  }),

  // 考试结构化数据
  exam: (examName: string, description: string, duration?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: examName,
    description: description,
    credentialCategory: '教师资格考试',
    recognizedBy: {
      '@type': 'Organization',
      name: '深圳市教育局'
    },
    ...(duration && { estimatedDuration: duration })
  }),

  // 面包屑导航结构化数据
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }),

  // 搜索框结构化数据
  searchBox: (searchUrl: string) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  })
}
