'use client'

import { useState } from 'react'
import { GlassCard, GlassButton } from '@/components/ui/GlassCard.tsx'
import { CheckCircle, Circle, Clock, Target, BookOpen, Lightbulb, TrendingUp } from 'lucide-react'

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

interface AnalysisTimelineProps {
  data: AIAnalysisResult
}

interface TimelineStep {
  id: string
  title: string
  description: string
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'concept' | 'practice' | 'review'
  content: string
  isCompleted: boolean
}

export default function AnalysisTimeline({ data }: AnalysisTimelineProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  // 生成学习路径步骤
  const generateTimelineSteps = (): TimelineStep[] => {
    const steps: TimelineStep[] = []

    // 1. 基础诊断回顾
    steps.push({
      id: 'diagnosis',
      title: '学习诊断回顾',
      description: '回顾AI分析结果，明确学习目标',
      estimatedTime: '5分钟',
      difficulty: 'easy',
      type: 'review',
      content: data.analysis_summary,
      isCompleted: false
    })

    // 2. 为每个知识点创建学习步骤
    data.targeted_tutoring_sessions.forEach((session, index) => {
      // 概念学习
      steps.push({
        id: `concept-${index}`,
        title: `学习：${session.knowledge_point}`,
        description: '深入理解核心概念和原理',
        estimatedTime: '15分钟',
        difficulty: 'medium',
        type: 'concept',
        content: session.core_concept_explanation,
        isCompleted: false
      })

      // 错题分析
      steps.push({
        id: `analysis-${index}`,
        title: `分析：${session.knowledge_point}相关错题`,
        description: '理解错误原因，掌握正确解题思路',
        estimatedTime: '10分钟',
        difficulty: 'medium',
        type: 'practice',
        content: session.wrong_question_analysis.analysis,
        isCompleted: false
      })

      // 实践应用
      steps.push({
        id: `practice-${index}`,
        title: `实践：${session.knowledge_point}应用`,
        description: '通过情境化例子加深理解',
        estimatedTime: '20分钟',
        difficulty: 'hard',
        type: 'practice',
        content: session.illustrative_examples.join('\n\n'),
        isCompleted: false
      })
    })

    // 3. 综合复习
    steps.push({
      id: 'review',
      title: '综合复习与巩固',
      description: '整合所有知识点，形成完整知识体系',
      estimatedTime: '30分钟',
      difficulty: 'hard',
      type: 'review',
      content: '复习所有学过的知识点，确保融会贯通',
      isCompleted: false
    })

    return steps
  }

  const timelineSteps = generateTimelineSteps()

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId)
    } else {
      newCompleted.add(stepId)
    }
    setCompletedSteps(newCompleted)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'concept': return <BookOpen className="w-5 h-5" />
      case 'practice': return <Target className="w-5 h-5" />
      case 'review': return <TrendingUp className="w-5 h-5" />
      default: return <Circle className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'concept': return 'from-blue-500 to-blue-600'
      case 'practice': return 'from-purple-500 to-purple-600'
      case 'review': return 'from-green-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const completedCount = completedSteps.size
  const totalSteps = timelineSteps.length
  const progressPercentage = (completedCount / totalSteps) * 100

  const totalEstimatedTime = timelineSteps.reduce((total, step) => {
    const minutes = parseInt(step.estimatedTime.replace('分钟', ''))
    return total + minutes
  }, 0)

  return (
    <div className="space-y-6">
      {/* 进度概览 */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">学习路径进度</h3>
            <p className="text-slate-600">
              已完成 {completedCount} / {totalSteps} 个步骤 • 预计总时长 {Math.floor(totalEstimatedTime / 60)}小时{totalEstimatedTime % 60}分钟
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
            <div className="text-sm text-slate-500">完成度</div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </GlassCard>

      {/* 时间线 */}
      <div className="space-y-4">
        {timelineSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isLast = index === timelineSteps.length - 1

          return (
            <div key={step.id} className="relative">
              {/* 连接线 */}
              {!isLast && (
                <div className="absolute left-6 top-16 w-0.5 h-16 bg-slate-200"></div>
              )}

              <GlassCard className={`relative ${isCompleted ? 'bg-green-50/50 border-green-200' : ''}`}>
                <div className="flex items-start gap-4">
                  {/* 步骤图标 */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleStepCompletion(step.id)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : `bg-gradient-to-r ${getTypeColor(step.type)} text-white hover:scale-105`
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : getTypeIcon(step.type)}
                    </button>
                  </div>

                  {/* 步骤内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`font-bold text-lg ${isCompleted ? 'text-green-800' : 'text-slate-800'}`}>
                        {step.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(step.difficulty)}`}>
                        {step.difficulty === 'easy' ? '简单' : step.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                    </div>

                    <p className="text-slate-600 mb-3">{step.description}</p>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{step.estimatedTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(step.type)}
                        <span>{step.type === 'concept' ? '概念学习' : step.type === 'practice' ? '实践练习' : '复习巩固'}</span>
                      </div>
                    </div>

                    {/* 学习内容 */}
                    <div className="bg-white/50 p-4 rounded-lg">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                        {step.content}
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 mt-4">
                      <GlassButton
                        onClick={() => toggleStepCompletion(step.id)}
                        variant={isCompleted ? 'glass' : 'primary'}
                        size="sm"
                      >
                        {isCompleted ? '标记为未完成' : '标记为完成'}
                      </GlassButton>
                      {step.type === 'practice' && (
                        <GlassButton variant="glass" size="sm">
                          <Target className="w-4 h-4" />
                          开始练习
                        </GlassButton>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )
        })}
      </div>

      {/* 完成激励 */}
      {progressPercentage === 100 && (
        <GlassCard className="text-center bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <div className="py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">🎉 恭喜完成学习路径！</h3>
            <p className="text-slate-600 mb-4">{data.motivational_message}</p>
            <GlassButton variant="primary" size="md">
              <TrendingUp className="w-4 h-4" />
              开始新的挑战
            </GlassButton>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
