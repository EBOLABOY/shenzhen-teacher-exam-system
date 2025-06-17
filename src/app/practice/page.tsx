'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, LogOut, Brain, Target, Clock, Award, Sparkles, ArrowLeft } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GlassCard, GlassButton, GlassContainer, LoadingGlass } from '@/components/ui/GlassCard'

function PracticeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  const [user, setUser] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(0)

  // 任务相关状态
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [isTaskMode, setIsTaskMode] = useState(false)
  const [taskProgress, setTaskProgress] = useState<any[]>([])

  // 从URL参数获取任务信息
  const taskId = searchParams.get('task_id')
  const mode = searchParams.get('mode')

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  const getQuestionType = (question: any) => {
    if (!question || !question.options) return 'unknown'
    const optionCount = Object.keys(question.options).length
    const answerLength = question.answer?.length || 0
    const options = Object.values(question.options)

    if ((optionCount === 2 && (options.includes('正确') || options.includes('错误'))) ||
        (optionCount === 0 && question.question.includes('（'))) {
      return 'trueOrFalse'
    } else if (answerLength > 1) {
      return 'multipleChoice'
    } else if (answerLength === 1 && optionCount > 2) {
      return 'singleChoice'
    }
    return 'unknown'
  }

  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'singleChoice':
        return { label: '单选题', icon: '○' }
      case 'multipleChoice':
        return { label: '多选题', icon: '□' }
      case 'trueOrFalse':
        return { label: '判断题', icon: '○' }
      default:
        return { label: '题目', icon: '?' }
    }
  }

  const questionType = currentQuestion ? getQuestionType(currentQuestion) : 'unknown'
  const questionTypeInfo = getQuestionTypeInfo(questionType)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // 检查是否是任务模式
      if (taskId) {
        setIsTaskMode(true)
        await loadTask(taskId, user)
      } else {
        await fetchQuestions(user)
      }
      setLoading(false)
    }
    checkAuth()
    if (!taskId) {
      fetchTotalQuestions()
    }
  }, [taskId])

  const fetchTotalQuestions = async () => {
    try {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
      if (!error && count !== null) {
        setTotalQuestions(count)
      }
    } catch (error) {
      console.error('获取题库总数失败:', error)
    }
  }

  // 加载任务
  const loadTask = async (taskId: string, currentUser: any) => {
    try {
      // 获取任务信息
      const { data: task, error: taskError } = await supabase
        .from('practice_tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', currentUser.id)
        .single()

      if (taskError) throw taskError
      if (!task) {
        alert('任务不存在或无权访问')
        router.push('/tasks')
        return
      }

      setCurrentTask(task)

      // 获取任务中的题目
      const { data: taskQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', task.question_ids)

      if (questionsError) throw questionsError

      // 按照任务中的顺序排列题目
      const orderedQuestions = task.question_ids.map((id: string) =>
        taskQuestions.find((q: any) => q.id === id)
      ).filter(Boolean)

      setQuestions(orderedQuestions)
      setTotalQuestions(orderedQuestions.length)

      // 获取任务进度
      const { data: progress, error: progressError } = await supabase
        .from('practice_task_progress')
        .select('*')
        .eq('task_id', taskId)
        .order('answered_at', { ascending: true })

      if (progressError) throw progressError
      setTaskProgress(progress || [])

      // 设置当前题目索引（基于已完成的进度）
      const completedCount = progress?.length || 0
      setCurrentQuestionIndex(Math.min(completedCount, orderedQuestions.length - 1))

      // 更新任务状态为进行中
      if (task.status === 'pending') {
        await supabase
          .from('practice_tasks')
          .update({
            status: 'in_progress',
            started_at: new Date().toISOString()
          })
          .eq('id', taskId)
      }

      setStartTime(new Date())
    } catch (error) {
      console.error('加载任务失败:', error)
      alert('加载任务失败，请重试')
      router.push('/tasks')
    }
  }

  const fetchQuestions = async (currentUser = user) => {
    if (!currentUser) return
    try {
      const { data: allQuestions, error } = await supabase
        .from('questions')
        .select('*')
        .limit(20)
      if (error) throw error
      if (allQuestions && allQuestions.length > 0) {
        const shuffled = allQuestions.sort(() => 0.5 - Math.random())
        setQuestions(shuffled)
        setStartTime(new Date())
      }
    } catch (error) {
      console.error('获取题目失败:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAnswerSelect = (answer: string) => {
    if (questionType === 'multipleChoice') {
      const newSelectedAnswers = selectedAnswers.includes(answer)
        ? selectedAnswers.filter(a => a !== answer)
        : [...selectedAnswers, answer].sort()
      setSelectedAnswers(newSelectedAnswers)
      const answerString = newSelectedAnswers.join('')
      setSelectedAnswer(answerString)
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: answerString }))
    } else {
      setSelectedAnswer(answer)
      setSelectedAnswers([answer])
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !user || !currentQuestion) return
    const isCorrect = selectedAnswer === currentQuestion.answer
    setShowExplanation(true)
    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    // 如果是任务模式，记录答题进度
    if (isTaskMode && currentTask) {
      try {
        // 检查是否已经回答过这道题
        const existingProgress = taskProgress.find(p => p.question_id === currentQuestion.id)

        if (!existingProgress) {
          const { error } = await supabase
            .from('practice_task_progress')
            .insert({
              task_id: currentTask.id,
              question_id: currentQuestion.id,
              user_answer: selectedAnswer,
              correct_answer: currentQuestion.answer,
              is_correct: isCorrect,
              time_spent: startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0
            })

          if (error) throw error

          // 更新任务统计
          const newCompletedCount = currentTask.completed_questions + 1
          const newCorrectCount = currentTask.correct_answers + (isCorrect ? 1 : 0)

          const updateData: any = {
            completed_questions: newCompletedCount,
            correct_answers: newCorrectCount
          }

          // 如果是最后一题，标记任务完成
          if (newCompletedCount >= currentTask.total_questions) {
            updateData.status = 'completed'
            updateData.completed_at = new Date().toISOString()
            updateData.actual_time = startTime ? Math.round((Date.now() - startTime.getTime()) / 60000) : 0
          }

          await supabase
            .from('practice_tasks')
            .update(updateData)
            .eq('id', currentTask.id)

          // 更新本地状态
          setCurrentTask((prev: any) => ({ ...prev, ...updateData }))
          setTaskProgress(prev => [...prev, {
            task_id: currentTask.id,
            question_id: currentQuestion.id,
            user_answer: selectedAnswer,
            correct_answer: currentQuestion.answer,
            is_correct: isCorrect
          }])

          // 如果答错了，添加到错题本
          if (!isCorrect) {
            await addToWrongQuestions(currentQuestion, selectedAnswer)
          }
        }
      } catch (error) {
        console.error('记录答题进度失败:', error)
      }
    }
  }

  // 添加到错题本
  const addToWrongQuestions = async (question: any, userAnswer: string) => {
    try {
      // 检查是否已经在错题本中
      const { data: existing } = await supabase
        .from('wrong_questions')
        .select('id, wrong_count')
        .eq('user_id', user.id)
        .eq('question_id', question.id)
        .single()

      if (existing) {
        // 更新错误次数
        await supabase
          .from('wrong_questions')
          .update({
            wrong_count: existing.wrong_count + 1,
            last_wrong_at: new Date().toISOString(),
            user_answer: userAnswer,
            is_mastered: false
          })
          .eq('id', existing.id)
      } else {
        // 添加新的错题记录
        await supabase
          .from('wrong_questions')
          .insert({
            user_id: user.id,
            question_id: question.id,
            user_answer: userAnswer,
            correct_answer: question.answer,
            question_type: question.type || 'multiple_choice',
            subject: question.subject,
            difficulty: question.difficulty,
            wrong_count: 1,
            first_wrong_at: new Date().toISOString(),
            last_wrong_at: new Date().toISOString(),
            is_mastered: false
          })
      }
    } catch (error) {
      console.error('添加错题失败:', error)
    }
  }

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      if (isTaskMode && currentTask) {
        // 任务模式完成
        const accuracy = Math.round((score / questions.length) * 100)
        alert(`任务完成！\n总题数：${questions.length}\n正确：${score}\n准确率：${accuracy}%`)
        router.push('/tasks')
      } else {
        // 普通练习模式完成
        alert(`练习完成！您的得分：${score}/${questions.length}`)
        router.push('/')
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer('')
      setSelectedAnswers([])
      setShowExplanation(false)
      setStartTime(new Date()) // 重置计时
    }
  }

  const handlePrevQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
      const prevAnswer = userAnswers[questions[currentQuestionIndex - 1]?.id] || ''
      setSelectedAnswer(prevAnswer)
      setSelectedAnswers(prevAnswer.split(''))
      setShowExplanation(false)
    }
  }

  const handleReset = () => {
    if (confirm('确定要重新开始吗？当前进度将丢失。')) {
      setCurrentQuestionIndex(0)
      setSelectedAnswer('')
      setSelectedAnswers([])
      setShowExplanation(false)
      setUserAnswers({})
      setScore(0)
      fetchQuestions()
    }
  }

  const getOptionClass = (option: string) => {
    const baseClass = "w-full text-left p-5 rounded-xl border-2 transition-all duration-300 flex items-center group hover:scale-[1.02] hover:shadow-lg"
    if (!showExplanation) {
      const isSelected = questionType === 'multipleChoice'
        ? selectedAnswers.includes(option)
        : selectedAnswer === option
      return isSelected
        ? `${baseClass} border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-lg scale-[1.02]`
        : `${baseClass} border-slate-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50/50 backdrop-blur-sm`
    }
    const correctAnswers = currentQuestion.answer.split('')
    const isCorrectAnswer = correctAnswers.includes(option)
    const isUserSelected = questionType === 'multipleChoice'
      ? selectedAnswers.includes(option)
      : selectedAnswer === option
    if (isCorrectAnswer) {
      return `${baseClass} border-green-500 bg-gradient-to-r from-green-50 to-green-100 text-green-800 shadow-lg`
    }
    if (isUserSelected && !isCorrectAnswer) {
      return `${baseClass} border-red-500 bg-gradient-to-r from-red-50 to-red-100 text-red-800 shadow-lg`
    }
    return `${baseClass} border-slate-200 bg-slate-50/50 text-slate-500`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingGlass message="正在加载题目..." />
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassContainer maxWidth="md">
          <GlassCard className="text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">暂无题目数据</h3>
            <p className="text-slate-600 mb-6">请联系管理员添加题目或稍后再试</p>
            <GlassButton variant="primary" href="/">返回首页</GlassButton>
          </GlassCard>
        </GlassContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GlassContainer maxWidth="2xl" className="py-8">
        {/* 用户信息栏 */}
        <GlassCard className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  {isTaskMode ? currentTask?.title || '任务练习' : '智能刷题练习'}
                </h1>
                <p className="text-slate-600">
                  {isTaskMode ? currentTask?.description : `欢迎，${user?.email}`}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  {isTaskMode ? (
                    <>
                      <span className="text-sm text-blue-600 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        任务进度：{currentTask?.completed_questions || 0}/{currentTask?.total_questions || 0}
                      </span>
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        正确率：{currentTask?.completed_questions > 0 ? Math.round((currentTask?.correct_answers / currentTask?.completed_questions) * 100) : 0}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-blue-600 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        题库总数：{totalQuestions} 道题
                      </span>
                      <span className="text-sm text-purple-600 flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        本次练习：{questions.length} 道题
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isTaskMode && (
              <GlassButton
                variant="glass"
                size="sm"
                onClick={() => router.push('/tasks')}
                className="text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                返回任务
              </GlassButton>
            )}
          </div>
        </GlassCard>

        {/* 进度条 */}
        <GlassCard variant="light" className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-slate-800">
                题目 {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="font-medium text-slate-800">
                得分: {score} / {Object.keys(userAnswers).length}
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>开始</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% 完成</span>
            <span>结束</span>
          </div>
        </GlassCard>

        {/* 题目卡片 */}
        <GlassCard className="mb-8 relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <div className="mb-6">
              {/* 题目标签 - 优化布局，让题型提示与科目难度并排 */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-full shadow-sm">
                  {currentQuestion.subject}
                </span>
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full shadow-sm ${
                  currentQuestion.difficulty === 'easy' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                  currentQuestion.difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                  'bg-gradient-to-r from-red-500 to-red-600 text-white'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? '简单' :
                   currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                </span>
                {/* 题型提示 - 现在与科目难度并排显示 */}
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${
                  questionType === 'singleChoice' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                  questionType === 'multipleChoice' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' :
                  'bg-gradient-to-r from-green-500 to-green-600 text-white'
                }`}>
                  <span className="mr-2 text-lg">{questionTypeInfo.icon}</span>
                  {questionTypeInfo.label}
                </span>
                {questionType === 'multipleChoice' && selectedAnswers.length > 0 && (
                  <span className="text-sm font-bold text-purple-600 bg-purple-100 px-3 py-1.5 rounded-full">
                    已选择 {selectedAnswers.length} 项
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* 选项 */}
            <div className="space-y-4 mb-8">
              {(() => {
                // 处理缺少选项的判断题
                let options = currentQuestion.options;
                if (questionType === 'trueOrFalse' && Object.keys(options).length === 0) {
                  options = { A: '正确', B: '错误' };
                }
                return Object.entries(options);
              })().map(([key, value]: [string, any]) => {
                const isSelected = questionType === 'multipleChoice'
                  ? selectedAnswers.includes(key)
                  : selectedAnswer === key

                return (
                  <button
                    key={key}
                    onClick={() => !showExplanation && handleAnswerSelect(key)}
                    disabled={showExplanation}
                    className={getOptionClass(key)}
                  >
                    {/* 选择指示器 */}
                    <div className="flex items-center mr-4">
                      {questionType === 'multipleChoice' ? (
                        // 多选题用方框
                        <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'border-blue-500 bg-blue-500 shadow-lg' : 'border-slate-300 group-hover:border-blue-400'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        // 单选题和判断题用圆圈
                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isSelected ? 'border-blue-500 bg-blue-500 shadow-lg' : 'border-slate-300 group-hover:border-blue-400'
                        }`}>
                          {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                        </div>
                      )}
                      <span className="font-bold ml-3 text-lg text-slate-700">{key}.</span>
                    </div>
                    <span className="flex-1 text-left font-medium">{value}</span>
                  </button>
                )
              })}
            </div>

            {/* 提交按钮 */}
            {!showExplanation && (
              <GlassButton
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || (questionType === 'multipleChoice' && selectedAnswers.length === 0)}
                variant="primary"
                size="lg"
                className="w-full"
              >
                <CheckCircle className="w-5 h-5" />
                提交答案
                {questionType === 'multipleChoice' && selectedAnswers.length > 0 && (
                  <span className="ml-2 text-sm">
                    (已选择 {selectedAnswers.length} 项)
                  </span>
                )}
              </GlassButton>
            )}

            {/* 答案解析 */}
            {showExplanation && (
              <GlassCard variant="light" className="border-l-4 border-green-500 bg-gradient-to-r from-green-50/50 to-blue-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-slate-800 text-lg">正确答案: {currentQuestion.answer}</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">{currentQuestion.explanation}</p>
              </GlassCard>
            )}
          </div>
        </GlassCard>

        {/* 导航按钮 */}
        <div className="flex justify-between items-center">
          <GlassButton
            onClick={handlePrevQuestion}
            disabled={isFirstQuestion}
            variant="glass"
            size="md"
            className="text-slate-600 hover:text-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
            上一题
          </GlassButton>

          <GlassButton
            onClick={handleReset}
            variant="secondary"
            size="md"
          >
            <RotateCcw className="h-4 w-4" />
            重新开始
          </GlassButton>

          <GlassButton
            onClick={handleNextQuestion}
            disabled={!showExplanation}
            variant="primary"
            size="md"
          >
            {isLastQuestion ? (
              <>
                <Award className="h-4 w-4" />
                完成练习
              </>
            ) : (
              <>
                下一题
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </GlassButton>
        </div>
      </GlassContainer>
    </div>
  )
}

export default function Practice() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingGlass message="正在加载练习..." />
      </div>
    }>
      <PracticeContent />
    </Suspense>
  )
}