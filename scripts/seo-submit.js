#!/usr/bin/env node

/**
 * SEO提交工具 - 帮助提交网站到各大搜索引擎
 */

const https = require('https')
const fs = require('fs')

const SITE_URL = 'https://szjk.izlx.de'

console.log('🚀 SEO提交工具 - 深圳教师考编练习系统')
console.log(`网站域名: ${SITE_URL}\n`)

// 检查网站可访问性
async function checkSiteAccessibility() {
  console.log('🔍 检查网站可访问性...')
  
  return new Promise((resolve) => {
    const req = https.get(SITE_URL, (res) => {
      console.log(`✅ 网站状态: ${res.statusCode}`)
      console.log(`✅ 响应头: ${JSON.stringify(res.headers, null, 2)}`)
      resolve(res.statusCode === 200)
    })
    
    req.on('error', (error) => {
      console.error('❌ 网站无法访问:', error.message)
      resolve(false)
    })
    
    req.setTimeout(10000, () => {
      console.error('❌ 网站访问超时')
      req.destroy()
      resolve(false)
    })
  })
}

// 检查重要页面
async function checkImportantPages() {
  console.log('\n📄 检查重要页面...')
  
  const pages = [
    '/',
    '/sitemap.xml',
    '/robots.txt',
    '/login',
    '/register',
    '/practice',
    '/exams'
  ]
  
  for (const page of pages) {
    const url = `${SITE_URL}${page}`
    try {
      await new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
          if (res.statusCode === 200) {
            console.log(`✅ ${page}: 正常`)
          } else {
            console.log(`⚠️  ${page}: ${res.statusCode}`)
          }
          resolve()
        })
        
        req.on('error', (error) => {
          console.log(`❌ ${page}: 无法访问`)
          resolve()
        })
        
        req.setTimeout(5000, () => {
          req.destroy()
          resolve()
        })
      })
    } catch (error) {
      console.log(`❌ ${page}: 检查失败`)
    }
  }
}

// 生成提交URL列表
function generateSubmissionUrls() {
  console.log('\n📋 生成搜索引擎提交信息...')
  
  const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/practice`,
    `${SITE_URL}/exams`,
    `${SITE_URL}/login`,
    `${SITE_URL}/register`
  ]
  
  console.log('\n🔗 主要页面URL:')
  urls.forEach(url => console.log(`- ${url}`))
  
  console.log('\n📊 SEO信息:')
  console.log(`- Sitemap: ${SITE_URL}/sitemap.xml`)
  console.log(`- Robots.txt: ${SITE_URL}/robots.txt`)
  
  return urls
}

// 百度提交指南
function baiduSubmissionGuide() {
  console.log('\n🔍 百度搜索引擎提交指南:')
  console.log('1. 访问百度站长工具: https://ziyuan.baidu.com/')
  console.log('2. 点击"用户中心" -> "站点管理" -> "添加网站"')
  console.log(`3. 输入网站: ${SITE_URL}`)
  console.log('4. 选择验证方式（推荐HTML标签验证）')
  console.log('5. 验证成功后，提交以下内容:')
  console.log(`   - Sitemap: ${SITE_URL}/sitemap.xml`)
  console.log('   - 主要页面URL（手动提交）')
  
  console.log('\n📝 百度快速收录API（如果有权限）:')
  console.log(`curl -H 'Content-Type:text/plain' --data-binary @urls.txt "http://data.zz.baidu.com/urls?site=${SITE_URL}&token=YOUR_TOKEN"`)
}

// Google提交指南
function googleSubmissionGuide() {
  console.log('\n🌐 Google搜索引擎提交指南:')
  console.log('1. 访问Google Search Console: https://search.google.com/search-console/')
  console.log('2. 点击"添加资源" -> "网址前缀"')
  console.log(`3. 输入网站: ${SITE_URL}`)
  console.log('4. 下载HTML验证文件并上传到网站根目录')
  console.log('5. 验证成功后，提交Sitemap:')
  console.log(`   - ${SITE_URL}/sitemap.xml`)
}

// 必应提交指南
function bingSubmissionGuide() {
  console.log('\n🔷 必应搜索引擎提交指南:')
  console.log('1. 访问必应站长工具: https://www.bing.com/webmasters/')
  console.log('2. 点击"添加站点"')
  console.log(`3. 输入网站: ${SITE_URL}`)
  console.log('4. 选择验证方式')
  console.log('5. 提交Sitemap和URL')
}

// 生成提交文件
function generateSubmissionFiles(urls) {
  console.log('\n📁 生成提交文件...')
  
  // 生成URL列表文件
  const urlsContent = urls.join('\n')
  fs.writeFileSync('urls.txt', urlsContent)
  console.log('✅ 已生成 urls.txt（用于批量提交）')
  
  // 生成SEO检查报告
  const report = `# SEO提交报告 - 深圳教师考编练习系统

## 网站信息
- 域名: ${SITE_URL}
- 生成时间: ${new Date().toLocaleString('zh-CN')}

## 主要页面
${urls.map(url => `- ${url}`).join('\n')}

## SEO文件
- Sitemap: ${SITE_URL}/sitemap.xml
- Robots.txt: ${SITE_URL}/robots.txt

## 关键词
- 深圳教师考编
- 深圳教师招聘
- 深圳社招
- 教师考编题库
- 深圳教师考试

## 提交状态
- [ ] 百度站长工具
- [ ] Google Search Console  
- [ ] 必应站长工具
- [ ] 360站长工具
- [ ] 搜狗站长工具

## 备注
请在各大搜索引擎站长工具中提交网站，并定期检查收录情况。
`
  
  fs.writeFileSync('seo-report.md', report)
  console.log('✅ 已生成 seo-report.md（SEO提交报告）')
}

// 主函数
async function main() {
  try {
    // 检查网站可访问性
    const isAccessible = await checkSiteAccessibility()
    if (!isAccessible) {
      console.log('❌ 网站无法访问，请检查部署状态')
      return
    }
    
    // 检查重要页面
    await checkImportantPages()
    
    // 生成提交URL
    const urls = generateSubmissionUrls()
    
    // 生成提交文件
    generateSubmissionFiles(urls)
    
    // 显示提交指南
    baiduSubmissionGuide()
    googleSubmissionGuide()
    bingSubmissionGuide()
    
    console.log('\n🎯 下一步操作:')
    console.log('1. 按照上述指南在各大搜索引擎站长工具中添加网站')
    console.log('2. 验证网站所有权')
    console.log('3. 提交sitemap.xml和主要页面URL')
    console.log('4. 等待1-4周进行收录')
    console.log('5. 定期检查收录情况和关键词排名')
    
    console.log('\n📊 预期效果:')
    console.log('- 1-2周内开始被搜索引擎收录')
    console.log('- 2-4周内可以搜索到网站')
    console.log('- 2-6个月内关键词排名逐步提升')
    
  } catch (error) {
    console.error('❌ 执行过程出错:', error)
  }
}

// 运行主函数
main()
