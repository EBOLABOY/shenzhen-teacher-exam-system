'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui/GlassCard.tsx'
import { ArrowLeft, Brain, Download, Share2, BookOpen, Sparkles } from 'lucide-react'

export default function AIAnalysisPage() {
  const router = useRouter()
  const [analysisContent, setAnalysisContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从sessionStorage获取AI分析的原始内容
    const storedContent = sessionStorage.getItem('aiAnalysisResult')
    if (storedContent) {
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
            <div className="prose prose-slate max-w-none">
              <div
                className="text-slate-700 leading-relaxed"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.7'
                }}
                dangerouslySetInnerHTML={{
                  __html: analysisContent
                    .replace(/\n/g, '<br>')
                    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-slate-800 mb-4 mt-6">$1</h1>')
                    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-slate-700 mb-3 mt-5">$1</h2>')
                    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium text-slate-600 mb-2 mt-4">$1</h3>')
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
                    .replace(/^- (.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
                    .replace(/^(\d+)\. (.+)$/gm, '<div class="ml-4 mb-1">$1. $2</div>')
                }}
              />
            </div>
          </div>
        </GlassCard>
      </GlassContainer>
    </div>
  )
}
