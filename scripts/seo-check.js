#!/usr/bin/env node

/**
 * SEO检查工具
 * 检查网站的SEO配置是否完整
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 开始SEO检查...\n')

// 检查必要文件是否存在
const requiredFiles = [
  'public/robots.txt',
  'src/lib/seo.ts',
  'src/components/seo/StructuredData.tsx',
  'src/app/sitemap.xml/route.ts'
]

console.log('📁 检查必要文件:')
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file))
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
})

// 检查页面SEO配置
const pageLayouts = [
  'src/app/login/layout.tsx',
  'src/app/register/layout.tsx',
  'src/app/practice/layout.tsx',
  'src/app/exams/layout.tsx',
  'src/app/wrong-questions/layout.tsx'
]

console.log('\n📄 检查页面SEO配置:')
pageLayouts.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file))
  console.log(`  ${exists ? '✅' : '❌'} ${file}`)
})

// 检查环境变量配置
console.log('\n🔧 检查环境变量配置:')
const envExample = path.join(process.cwd(), '.env.example')
if (fs.existsSync(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8')
  const seoVars = [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_BAIDU_ANALYTICS',
    'NEXT_PUBLIC_BAIDU_VERIFICATION',
    'NEXT_PUBLIC_GOOGLE_VERIFICATION'
  ]
  
  seoVars.forEach(varName => {
    const exists = envContent.includes(varName)
    console.log(`  ${exists ? '✅' : '❌'} ${varName}`)
  })
} else {
  console.log('  ❌ .env.example 文件不存在')
}

// 检查robots.txt内容
console.log('\n🤖 检查robots.txt内容:')
const robotsPath = path.join(process.cwd(), 'public/robots.txt')
if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8')
  const checks = [
    { name: '包含Sitemap', test: robotsContent.includes('Sitemap:') },
    { name: '允许主要页面', test: robotsContent.includes('Allow: /') },
    { name: '禁止管理页面', test: robotsContent.includes('Disallow: /admin/') },
    { name: '禁止API路径', test: robotsContent.includes('Disallow: /api/') }
  ]
  
  checks.forEach(check => {
    console.log(`  ${check.test ? '✅' : '❌'} ${check.name}`)
  })
} else {
  console.log('  ❌ robots.txt 文件不存在')
}

// 检查manifest.json
console.log('\n📱 检查PWA配置:')
const manifestPath = path.join(process.cwd(), 'public/manifest.json')
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const checks = [
      { name: '包含name', test: !!manifest.name },
      { name: '包含description', test: !!manifest.description },
      { name: '包含icons', test: !!manifest.icons && manifest.icons.length > 0 },
      { name: '包含start_url', test: !!manifest.start_url },
      { name: '包含theme_color', test: !!manifest.theme_color }
    ]
    
    checks.forEach(check => {
      console.log(`  ${check.test ? '✅' : '❌'} ${check.name}`)
    })
  } catch (error) {
    console.log('  ❌ manifest.json 格式错误')
  }
} else {
  console.log('  ❌ manifest.json 文件不存在')
}

console.log('\n🎯 SEO优化建议:')
console.log('1. 确保所有页面都有独特的title和description')
console.log('2. 添加结构化数据到重要页面')
console.log('3. 优化图片alt标签和文件名')
console.log('4. 确保网站加载速度快')
console.log('5. 提交sitemap到搜索引擎')
console.log('6. 定期检查和更新内容')

console.log('\n📊 下一步操作:')
console.log('1. 配置环境变量中的SEO相关设置')
console.log('2. 在百度站长工具中验证网站')
console.log('3. 在Google Search Console中验证网站')
console.log('4. 提交sitemap.xml到搜索引擎')
console.log('5. 监控SEO效果和排名变化')

console.log('\n✨ SEO检查完成!')
