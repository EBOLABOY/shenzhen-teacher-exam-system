'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import { BookOpen, Brain, TrendingUp, ArrowLeft, RefreshCw, Sparkles, Zap, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { DIFFICULTY_MAPPING, QUESTION_TYPE_MAPPING } from '@/config/ai-prompts'
import ThinkingAnimation from '@/components/ui/ThinkingAnimation'

interface WrongQuestion {
  id: string
  question_id: string
  user_id: string
  user_answer: string
  correct_answer: string
  question_type: string
  subject: string
  difficulty: string
  wrong_count: number
  first_wrong_at: string
  last_wrong_at: string
  is_mastered: boolean
  mastered_at?: string
  created_at: string
  updated_at: string
  questions: {
    id: string
    question: string
    options: Record<string, string>
    answer: string
    explanation?: string
    subject: string
    difficulty: string
    type: string
  }
}

interface AIAnalysisResult {
  analysis_summary: string
  weakness_diagnostic: {
    subject: string
    chapter: string
    knowledge_points: string[]
  }
  targeted_tutoring_sessions: Array<{
    knowledge_point: string
    core_concept_explanation: string
    wrong_question_analysis: {
      question_stem: string
      user_answer: string
      correct_answer: string
      analysis: string
    }
    illustrative_examples: string[]
    knowledge_mind_map: {
      title: string
      map: string[]
    }
  }>
  motivational_message: string
}

export default function WrongQuestionsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await fetchWrongQuestions(user.id)
    } catch (error) {
      console.error('用户验证失败:', error)
      router.push('/login')
    }
  }

  const fetchWrongQuestions = async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('wrong_questions')
        .select(`
          *,
          questions (
            id,
            question,
            options,
            answer,
            explanation,
            subject,
            difficulty,
            type
          )
        `)
        .eq('user_id', userId)
        .order('last_wrong_at', { ascending: false })

      if (error) {
        console.error('获取错题数据库错误:', error)
        throw error
      }

      // 错题数据获取成功
      setWrongQuestions(data || [])
    } catch (error) {
      console.error('获取错题失败:', error)
      // 显示更详细的错误信息
      if (error instanceof Error && error.message) {
        alert(`获取错题失败: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const removeFromWrongQuestions = async (wrongQuestionId: string) => {
    try {
      const { error } = await supabase
        .from('wrong_questions')
        .delete()
        .eq('id', wrongQuestionId)

      if (error) throw error

      setWrongQuestions(prev => prev.filter(wq => wq.id !== wrongQuestionId))
    } catch (error) {
      console.error('移除错题失败:', error)
    }
  }

  // AI错题分析功能
  const analyzeWrongQuestions = async () => {
    if (wrongQuestions.length === 0) {
      alert('暂无错题可分析')
      return
    }

    setAiLoading(true)
    setAnalysisStartTime(Date.now())

    try {
      console.log('🤖 开始AI分析错题...')
      console.log('错题数量:', wrongQuestions.length)

      // 调用服务端AI分析API
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('响应状态:', response.status, response.statusText)

      let data
      try {
        data = await response.json()
        console.log('AI分析响应:', data)
      } catch (parseError) {
        console.error('响应解析失败:', parseError)
        throw new Error('服务器响应格式错误，请稍后重试')
      }

      if (!response.ok) {
        console.error('API错误响应:', data)
        throw new Error(data.error || `AI分析请求失败: ${response.status}`)
      }

      if (!data.analysis) {
        throw new Error('AI分析响应格式异常')
      }

      // 检查是否是备用响应
      if (data.analysis.fallback) {
        console.log('⚠️ 使用备用分析结果')
      }

      // 显示分析完成时间
      if (analysisStartTime) {
        const duration = Math.round((Date.now() - analysisStartTime) / 1000)
        console.log(`🎉 AI分析完成，耗时 ${duration} 秒`)
      }

      // 直接保存AI返回的原始分析内容
      // 优先使用fullAnalysis，如果没有则尝试其他字段
      let analysisContent = data.analysis.fullAnalysis ||
                           data.analysis.analysis_summary ||
                           data.analysis ||
                           "AI分析已完成，为您提供个性化的学习建议。"

      // 如果分析内容太短，尝试组合更多信息
      if (typeof analysisContent === 'string' && analysisContent.length < 100) {
        const additionalInfo = []

        if (data.analysis.weakSubjects && data.analysis.weakSubjects.length > 0) {
          additionalInfo.push(`\n\n## 薄弱科目分析`)
          data.analysis.weakSubjects.forEach((subject: any, index: number) => {
            additionalInfo.push(`\n### ${index + 1}. ${subject.subject}`)
            if (subject.analysis) {
              additionalInfo.push(`${subject.analysis}`)
            }
            if (subject.recommendations && subject.recommendations.length > 0) {
              additionalInfo.push(`\n**学习建议：**`)
              subject.recommendations.forEach((rec: string) => {
                additionalInfo.push(`- ${rec}`)
              })
            }
          })
        }

        if (data.analysis.recommendations && data.analysis.recommendations.length > 0) {
          additionalInfo.push(`\n\n## 总体建议`)
          data.analysis.recommendations.forEach((rec: string) => {
            additionalInfo.push(`- ${rec}`)
          })
        }

        if (data.analysis.motivationalMessage) {
          additionalInfo.push(`\n\n## 学习激励`)
          additionalInfo.push(data.analysis.motivationalMessage)
        }

        if (additionalInfo.length > 0) {
          analysisContent += additionalInfo.join('\n')
        }
      }

      // 保存原始分析内容到sessionStorage并跳转到新页面
      sessionStorage.setItem('aiAnalysisResult', analysisContent)
      router.push('/ai-analysis')
    } catch (error) {
      console.error('AI分析失败:', error)

      let errorMessage = '未知错误'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '请求超时，请稍后重试'
        } else {
          errorMessage = error.message
        }
      }

      alert(`AI分析失败: ${errorMessage}`)
    } finally {
      setAiLoading(false)
      setAnalysisStartTime(null)
    }
  }

  // 开始错题复习练习
  const startWrongQuestionsPractice = async () => {
    if (wrongQuestions.length === 0) {
      alert('暂无错题可复习')
      return
    }

    try {
      if (!user) {
        alert('请先登录')
        return
      }

      // 创建错题复习任务
      const taskData = {
        user_id: user.id,
        task_type: 'wrong_questions_review',
        title: `错题复习 - ${wrongQuestions.length}题`,
        description: `复习您的${wrongQuestions.length}道错题，巩固薄弱知识点`,
        question_ids: wrongQuestions.map(wq => wq.question_id),
        total_questions: wrongQuestions.length,
        completed_questions: 0,
        status: 'pending',
        difficulty_distribution: {
          easy: wrongQuestions.filter(wq => (wq.difficulty || wq.questions?.difficulty) === 'easy').length,
          medium: wrongQuestions.filter(wq => (wq.difficulty || wq.questions?.difficulty) === 'medium').length,
          hard: wrongQuestions.filter(wq => (wq.difficulty || wq.questions?.difficulty) === 'hard').length
        },
        subject_distribution: wrongQuestions.reduce((acc, wq) => {
          const subject = wq.subject || wq.questions?.subject || '未知科目'
          acc[subject] = (acc[subject] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        estimated_time: wrongQuestions.length * 2, // 每题预计2分钟
        created_at: new Date().toISOString()
      }

      // 保存任务到数据库
      const { data: task, error: taskError } = await supabase
        .from('practice_tasks')
        .insert(taskData)
        .select()
        .single()

      if (taskError) {
        console.error('创建任务失败:', taskError)

        // 检查是否是表不存在的错误
        if (taskError.code === '42P01') {
          alert('练习任务功能尚未初始化，请联系管理员创建相关数据表')
        } else {
          alert(`创建复习任务失败：${taskError.message || '未知错误'}`)
        }
        return
      }

      console.log('✅ 错题复习任务创建成功:', task)

      // 跳转到练习页面
      router.push(`/practice?task_id=${task.id}&mode=wrong_questions`)
    } catch (error) {
      console.error('开始错题复习失败:', error)
      alert('开始复习失败，请重试')
    }
  }



  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 'medium': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'hard': return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return '未知'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">加载错题本中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GlassContainer maxWidth="2xl" className="py-8">
        {/* 页面标题 */}
        <GlassCard className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-red-600" />
                  我的错题本
                </h1>
                <p className="text-slate-600 mt-2">
                  回顾错题，巩固知识点，提升答题准确率
                </p>
              </div>
            </div>

          </div>
        </GlassCard>

        {/* 统计信息和AI分析 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">错题总数</h3>
            <p className="text-3xl font-bold text-red-600">{wrongQuestions.length}</p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">涉及科目</h3>
            <p className="text-3xl font-bold text-blue-600">
              {new Set(wrongQuestions.map(wq => wq.subject || wq.questions?.subject || '未知科目')).size}
            </p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">待复习</h3>
            <p className="text-3xl font-bold text-green-600 mb-3">{wrongQuestions.length}</p>
            <GlassButton
              onClick={() => startWrongQuestionsPractice()}
              disabled={wrongQuestions.length === 0}
              variant="primary"
              size="sm"
              className="w-full"
            >
              <BookOpen className="w-4 h-4" />
              开始复习
            </GlassButton>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">AI分析</h3>
            <GlassButton
              onClick={analyzeWrongQuestions}
              disabled={aiLoading || wrongQuestions.length === 0}
              variant="primary"
              size="sm"
              className="w-full"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  开始分析
                </>
              )}
            </GlassButton>
          </GlassCard>
        </div>



        {/* 错题列表 */}
        {wrongQuestions.length === 0 ? (
          <GlassCard className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">暂无错题</h3>
            <p className="text-slate-500 mb-6">您还没有答错的题目，继续保持！</p>
            <GlassButton
              onClick={() => router.push('/practice')}
              variant="primary"
              size="md"
            >
              开始练习
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {wrongQuestions.map((wrongQuestion, index) => (
              <GlassCard key={wrongQuestion.id} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-full">
                        {wrongQuestion.subject || wrongQuestion.questions?.subject || '未知科目'}
                      </span>
                      <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${getDifficultyColor(wrongQuestion.difficulty || wrongQuestion.questions?.difficulty || 'medium')}`}>
                        {getDifficultyText(wrongQuestion.difficulty || wrongQuestion.questions?.difficulty || 'medium')}
                      </span>
                      <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium px-3 py-1.5 rounded-full">
                        {QUESTION_TYPE_MAPPING[(wrongQuestion.question_type || wrongQuestion.questions?.type || 'multiple_choice') as keyof typeof QUESTION_TYPE_MAPPING]?.name || (wrongQuestion.question_type || wrongQuestion.questions?.type || '未知题型')}
                      </span>
                      {(wrongQuestion.wrong_count || 1) > 1 && (
                        <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-full">
                          错误 {wrongQuestion.wrong_count || 1} 次
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(wrongQuestion.last_wrong_at).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 mb-4 text-lg">
                    {index + 1}. {wrongQuestion.questions?.question || '题目信息缺失'}
                  </h3>

                  {wrongQuestion.questions?.options ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                      {(() => {
                        // 处理选项格式化
                        let options = wrongQuestion.questions.options;

                        // 如果是字符串，尝试解析为JSON
                        if (typeof options === 'string') {
                          try {
                            options = JSON.parse(options);
                          } catch (e) {
                            console.error('解析错题选项失败:', e, '原始数据:', options);
                            options = {};
                          }
                        }

                        // 确保options是一个有效的对象
                        if (!options || typeof options !== 'object' || Array.isArray(options)) {
                          console.warn('错题选项数据格式异常:', options);
                          options = {};
                        }

                        return Object.entries(options);
                      })().map(([key, value]) => {
                        const correctAnswer = wrongQuestion.questions?.answer || wrongQuestion.correct_answer;
                        const userAnswer = wrongQuestion.user_answer;
                        const isCorrect = correctAnswer === key;
                        const isUserChoice = userAnswer === key;

                        return (
                        <div key={key} className={`p-3 rounded-lg border-2 transition-all ${
                          isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : isUserChoice
                            ? 'border-red-500 bg-red-50 text-red-800'
                            : 'border-slate-200 bg-slate-50'
                        }`}>
                          <span className="font-bold">{key}.</span> {value}
                          {isCorrect && (
                            <span className="ml-2 text-green-600 font-bold">✓ 正确答案</span>
                          )}
                          {isUserChoice && !isCorrect && (
                            <span className="ml-2 text-red-600 font-bold">✗ 您的答案</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 mb-4">选项信息缺失</div>
                  )}

                  {wrongQuestion.questions?.explanation && (
                    <GlassCard variant="light" className="border-l-4 border-blue-500 bg-blue-50/30 mb-4">
                      <p className="text-sm text-slate-700">
                        <strong className="text-blue-700">解析：</strong>
                        {wrongQuestion.questions.explanation}
                      </p>
                    </GlassCard>
                  )}

                  <div className="flex justify-end">
                    <GlassButton
                      onClick={() => removeFromWrongQuestions(wrongQuestion.id)}
                      variant="glass"
                      size="sm"
                    >
                      已掌握，移除
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </GlassContainer>

      {/* 思考动画 */}
      <ThinkingAnimation
        isVisible={aiLoading}
        onCancel={() => {
          setAiLoading(false)
          setAnalysisStartTime(null)
        }}
      />
    </div>
  )
}