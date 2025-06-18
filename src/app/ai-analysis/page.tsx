'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'

import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import MermaidChart from '@/components/MermaidChart'
import { ArrowLeft, Brain, Download, Share2, BookOpen, Sparkles } from 'lucide-react'
import 'highlight.js/styles/github.css'

export default function AIAnalysisPage() {
  const router = useRouter()
  const [analysisContent, setAnalysisContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从sessionStorage获取AI分析的原始内容
    const storedContent = sessionStorage.getItem('aiAnalysisResult')
    if (storedContent) {
      console.log('AI分析原始内容:', storedContent)
      console.log('内容长度:', storedContent.length)
      console.log('是否包含mermaid:', storedContent.includes('```mermaid'))
      setAnalysisContent(storedContent)
    }
    setLoading(false)
  }, [])

  const exportAnalysis = () => {
    if (!analysisContent) return

    const exportContent = `# AI私教分析报告

${analysisContent}

---
生成时间：${new Date().toLocaleString()}`

    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `AI错题分析报告_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const shareAnalysis = async () => {
    if (!analysisContent) return

    const shareText = `我刚完成了AI错题分析，获得了个性化的学习建议！`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI私教分析报告',
          text: shareText,
          url: window.location.href
        })
      } catch (error) {
        console.log('分享取消或失败')
      }
    } else {
      // 复制到剪贴板
      try {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
        alert('链接已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">加载分析结果中...</p>
        </div>
      </div>
    )
  }

  if (!analysisContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center p-8">
          <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600 mb-2">未找到分析数据</h3>
          <p className="text-slate-500 mb-6">请先进行错题分析</p>
          <GlassButton
            onClick={() => router.push('/wrong-questions')}
            variant="primary"
            size="md"
          >
            返回错题本
          </GlassButton>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <GlassContainer maxWidth="2xl" className="py-8">
        {/* 页面标题 */}
        <GlassCard className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GlassButton
                onClick={() => router.push('/wrong-questions')}
                variant="glass"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </GlassButton>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">AI私教分析报告</h1>
                <p className="text-slate-600 mt-2">基于您的错题进行精准诊断和靶向教学</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton onClick={shareAnalysis} variant="glass" size="sm">
                <Share2 className="w-4 h-4" />
                分享
              </GlassButton>
              <GlassButton onClick={exportAnalysis} variant="glass" size="sm">
                <Download className="w-4 h-4" />
                导出
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* AI分析内容 */}
        <GlassCard className="border-l-4 border-purple-500 bg-gradient-to-br from-purple-50/30 to-blue-50/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">AI智能分析结果</h2>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6 prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-5 prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2 prose-h3:mt-4 prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-slate-800 prose-ul:my-4 prose-li:my-1 prose-ol:my-4">


              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-slate-800 mb-4 mt-6 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-slate-700 mb-3 mt-5 flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-slate-600 mb-2 mt-4 flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-2 my-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-2 my-4">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-2 text-slate-700">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{children}</span>
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-800 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {children}
                    </strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-50/50 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className
                    // 检查是否为Mermaid代码块
                    const isMermaid = className?.includes('language-mermaid')
                    const language = className?.replace(/^hljs\s+language-/, '').replace('language-', '')

                    console.log('代码块处理:', {
                      isInline,
                      className,
                      language,
                      isMermaid,
                      content: String(children).substring(0, 100) + '...',
                      fullContent: String(children)
                    })

                    if (isInline) {
                      return (
                        <code className="bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      )
                    }

                    // 处理Mermaid图表 - 直接检查className
                    if (isMermaid) {
                      const mermaidCode = String(children).replace(/\n$/, '')
                      console.log('检测到Mermaid代码块:', className)
                      console.log('Mermaid代码内容:', mermaidCode)
                      return <MermaidChart chart={mermaidCode} />
                    }

                    return (
                      <code className={className}>
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => {
                    console.log('Pre标签处理:', children)

                    // 检查是否包含Mermaid代码块
                    const codeElement = React.Children.toArray(children).find(
                      (child: any) => child?.props?.className?.includes('language-mermaid')
                    )

                    if (codeElement) {
                      console.log('Pre中发现Mermaid代码块，直接返回children')
                      return <>{children}</>
                    }

                    return (
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4">
                        {children}
                      </pre>
                    )
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-slate-200 rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="bg-slate-50 border border-slate-200 px-4 py-2 text-left font-semibold text-slate-700">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-slate-200 px-4 py-2 text-slate-700">
                      {children}
                    </td>
                  ),
                }}
              >
                {analysisContent}
              </ReactMarkdown>

              {/* 检查并渲染SVG图表 */}
              {analysisContent.includes('<svg') && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    可视化图表
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                    <div
                      className="flex justify-center"
                      dangerouslySetInnerHTML={{
                        __html: analysisContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/gi)?.[0] || ''
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </GlassContainer>
    </div>
  )
}
