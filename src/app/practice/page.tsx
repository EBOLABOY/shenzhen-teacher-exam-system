'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, LogOut, Brain, Target, Clock, Award, Sparkles, ArrowLeft } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer, LoadingGlass } from '@/components/ui'
import { useIsMobile } from '@/hooks/useMediaQuery'

function PracticeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  const [completedQuestions, setCompletedQuestions] = useState(0)

  // 任务相关状态
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [isTaskMode, setIsTaskMode] = useState(false)
  const [taskProgress, setTaskProgress] = useState<any[]>([])
  const [isWrongQuestionMastered, setIsWrongQuestionMastered] = useState(false)

  // 考试模式状态
  const [isExamMode, setIsExamMode] = useState(false)
  const [examInfo, setExamInfo] = useState<any>(null)

  // 预测卷模式状态
  const [isPredictionMode, setIsPredictionMode] = useState(false)
  const [predictionInfo, setPredictionInfo] = useState<any>(null)

  // 从URL参数获取任务信息
  const taskId = searchParams.get('task_id')
  const mode = searchParams.get('mode')
  const examYear = searchParams.get('exam_year')
  const examDate = searchParams.get('exam_date')
  const examSegment = searchParams.get('exam_segment')

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

      // 获取用户已完成题目数量
      await fetchCompletedQuestions(user)

      // 检查模式类型
      if (taskId) {
        setIsTaskMode(true)
        await loadTask(taskId, user)
      } else if (mode === 'exam' && examYear && examDate) {
        setIsExamMode(true)
        await loadExamQuestions(user)
      } else if (mode === 'prediction' && examYear && examDate) {
        setIsPredictionMode(true)
        await loadPredictionQuestions(user)
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

  const fetchCompletedQuestions = async (currentUser: any) => {
    try {
      const { count, error } = await supabase
        .from('user_answers')
        .select('question_id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)

      if (!error && count !== null) {
        setCompletedQuestions(count)
        // 已完成题目数量更新
      }
    } catch (error) {
      console.error('获取已完成题目数量失败:', error)
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

      // 按照任务中的顺序排列题目并格式化选项
      const orderedQuestions = task.question_ids.map((id: string) => {
        const question = taskQuestions.find((q: any) => q.id === id)
        if (question) {
          // 确保选项是对象格式
          let options = question.options;
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options);
            } catch (e) {
              console.error('解析任务题目选项失败:', e, '原始数据:', options);
              options = {};
            }
          }

          return {
            ...question,
            options: options
          };
        }
        return null;
      }).filter(Boolean)

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

  // 加载考试题目
  const loadExamQuestions = async (currentUser: any) => {
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_year: parseInt(examYear!),
          exam_date: examDate!,
          exam_segment: examSegment || null
        })
      })

      const result = await response.json()

      if (result.success) {
        setQuestions(result.data)
        setTotalQuestions(result.data.length)
        setExamInfo(result.exam_info)
        setStartTime(new Date())

        console.log(`加载考试题目成功: ${result.data.length} 道题`)
        console.log('考试信息:', result.exam_info)
      } else {
        console.error('加载考试题目失败:', result.error)
        alert('加载考试题目失败，请重试')
        router.push('/exams')
      }
    } catch (error) {
      console.error('加载考试题目失败:', error)
      alert('加载考试题目失败，请重试')
      router.push('/exams')
    }
  }

  // 加载预测卷题目
  const loadPredictionQuestions = async (currentUser: any) => {
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_year: parseInt(examYear!),
          exam_date: examDate!,
          exam_segment: examSegment!
        })
      })

      const result = await response.json()

      if (result.success) {
        setQuestions(result.data.questions)
        setTotalQuestions(result.data.questions.length)
        setPredictionInfo(result.data.exam_info)
        setStartTime(new Date())

        console.log(`加载预测卷题目成功: ${result.data.questions.length} 道题`)
        console.log('预测卷信息:', result.data.exam_info)
      } else {
        console.error('加载预测卷题目失败:', result.error)
        alert('加载预测卷题目失败，请重试')
        router.push('/exams')
      }
    } catch (error) {
      console.error('加载预测卷题目失败:', error)
      alert('加载预测卷题目失败，请重试')
      router.push('/exams')
    }
  }

  const fetchQuestions = async (currentUser = user) => {
    if (!currentUser) return
    try {
      // 1. 获取用户已做过的题目ID
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', currentUser.id)

      if (answersError) {
        console.error('获取用户答题记录失败:', answersError)
      }

      const answeredQuestionIds = userAnswers?.map(answer => answer.question_id) || []

      // 2. 构建查询，排除已做过的题目
      let query = supabase
        .from('questions')
        .select('*')

      // 如果有已做过的题目，排除它们
      if (answeredQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`)
      }

      // 3. 只获取25道题目，给5道题的容错空间
      const { data: allQuestions, error } = await query
        .order('id', { ascending: false }) // 先按ID排序
        .limit(25) // 只获取25道题目，节省资源

      if (error) throw error

      if (allQuestions && allQuestions.length > 0) {
        // 4. 格式化题目数据，确保选项是对象格式
        const formattedQuestions = allQuestions.map(q => {
          let options = q.options;

          // 处理字符串格式的选项
          if (typeof options === 'string') {
            try {
              options = JSON.parse(options);
            } catch (e) {
              console.error('解析选项失败:', e, '题目ID:', q.id, '原始数据:', options);
              options = {};
            }
          }

          // 确保options是一个有效的对象
          if (!options || typeof options !== 'object' || Array.isArray(options)) {
            console.warn('选项数据格式异常，题目ID:', q.id, '原始数据:', options);
            options = {};
          }

          return {
            ...q,
            options: options
          };
        });

        // 5. 从格式化的题目中随机选择20道
        const shuffled = formattedQuestions
          .sort(() => Math.random() - 0.5) // 更好的随机排序
          .slice(0, Math.min(20, formattedQuestions.length))

        setQuestions(shuffled)
        setStartTime(new Date())

        // 练习题目获取成功
      } else {
        // 如果没有未做的题目，提示用户
        alert('恭喜！您已经完成了所有题目的练习。可以重新开始或查看错题本进行复习。')
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

    try {
      // 记录用户答题记录（无论是否为任务模式）
      await supabase
        .from('user_answers')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_spent: startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0
        })

      // 更新已完成题目数量
      setCompletedQuestions(prev => prev + 1)

      // 同步用户进度统计
      try {
        await fetch('/api/user-progress/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      } catch (error) {
        console.warn('同步用户进度失败:', error)
      }

      // 如果答错了，添加到错题本（无论是否为任务模式）
      if (!isCorrect) {
        await addToWrongQuestions(currentQuestion, selectedAnswer)
      }

      // 如果是错题复习模式且答对了，从错题本中移除该题目
      if (isCorrect && isTaskMode && currentTask && currentTask.task_type === 'wrong_questions_review') {
        await removeFromWrongQuestions(currentQuestion.id)
        // 设置一个标记，在UI中显示特殊提示
        setIsWrongQuestionMastered(true)
      }

      // 如果是任务模式，记录任务进度
      if (isTaskMode && currentTask) {
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
        }
      }
    } catch (error) {
      console.error('记录答题进度失败:', error)
    }
  }

  // 添加到错题本
  const addToWrongQuestions = async (question: any, userAnswer: string) => {
    console.log('🔴 添加错题到错题本:', {
      questionId: question.id,
      userAnswer,
      correctAnswer: question.answer
    })

    try {
      const response = await fetch('/api/wrong-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: question.id,
          user_answer: userAnswer,
          correct_answer: question.answer,
          question_type: question.type || 'multiple_choice',
          subject: question.subject || '教育学',
          difficulty: question.difficulty || 'medium'
        })
      })

      const result = await response.json()

      if (response.ok) {
        // 兼容现有API返回格式
        const wrongCount = result.data?.wrong_count || result.wrongCount || 1
        const action = result.data ? (result.data.wrong_count > 1 ? '更新' : '添加') : '添加'
        console.log(`✅ 错题记录${action}成功，错误次数: ${wrongCount}`)
      } else {
        console.error('❌ 错题记录失败:', result.error)
      }
    } catch (error) {
      console.error('❌ 添加错题失败:', error)
    }
  }

  // 从错题本中移除题目（当在错题复习中答对时）
  const removeFromWrongQuestions = async (questionId: number) => {
    try {
      console.log('🗑️ 错题复习答对，从错题本中移除题目:', questionId)

      const response = await fetch(`/api/wrong-questions?questionId=${questionId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        console.log(`✅ 成功从错题本移除题目 (删除了 ${result.deletedCount} 条记录)`)
        if (result.deletedCount > 0) {
          console.log('🎉 恭喜！这道题已从错题本中移除，说明您已经掌握了！')
        }
      } else {
        console.error('❌ 从错题本移除题目失败:', result.error)
      }
    } catch (error) {
      console.error('❌ 移除错题异常:', error)
      // 静默处理错误，不影响用户答题体验
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
      setIsWrongQuestionMastered(false) // 重置错题掌握状态
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

  const handleResetAllProgress = async () => {
    if (confirm('确定要清除所有答题记录吗？这将允许您重新做所有题目，但会丢失所有学习进度。')) {
      try {
        // 删除用户的所有答题记录
        await supabase
          .from('user_answers')
          .delete()
          .eq('user_id', user.id)

        // 重置已完成题目数量
        setCompletedQuestions(0)

        alert('答题记录已清除，现在可以重新做所有题目了！')

        // 重新获取题目
        fetchQuestions()
      } catch (error) {
        console.error('清除答题记录失败:', error)
        alert('清除答题记录失败，请稍后重试')
      }
    }
  }

  const getOptionClass = (option: string) => {
    const baseClass = `w-full text-left rounded-xl border-2 transition-all duration-300 flex items-center group hover:scale-[1.02] hover:shadow-lg ${isMobile ? 'p-3' : 'p-5'}`
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {questions.length === 0 ? '恭喜！所有题目已完成' : '暂无题目数据'}
            </h3>
            <p className="text-slate-600 mb-6">
              {questions.length === 0
                ? '您已经完成了所有题目的练习！可以查看错题本进行复习，或清除进度重新开始。'
                : '请联系管理员添加题目或稍后再试'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <GlassButton variant="primary" href="/">返回首页</GlassButton>
              <GlassButton variant="secondary" href="/wrong-questions">查看错题本</GlassButton>
              {questions.length === 0 && (
                <GlassButton
                  variant="glass"
                  onClick={handleResetAllProgress}
                  className="text-red-600 hover:text-red-800"
                >
                  重新开始所有题目
                </GlassButton>
              )}
            </div>
          </GlassCard>
        </GlassContainer>
      </div>
    )
  }

  return (
    <div className={`h-screen overflow-hidden ${isMobile ? 'pt-12' : 'pt-16'}`}>
      <GlassContainer maxWidth="2xl" className={`h-full overflow-y-auto ${isMobile ? 'py-1 pb-3' : 'py-4 pb-6'}`}>
        {/* 用户信息栏 */}
        <GlassCard className={isMobile ? 'mb-2' : 'mb-8'}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`}>
                <Brain className={`text-white ${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`} />
              </div>
              <div>
                <h1 className={`font-bold text-slate-800 flex items-center gap-2 ${isMobile ? 'text-base' : 'text-2xl'}`}>
                  <Sparkles className={`text-blue-600 ${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`} />
                  {isTaskMode ? currentTask?.title || '任务练习' :
                   isExamMode ? `${examInfo?.year}年真题练习` :
                   isPredictionMode ? `${predictionInfo?.year}年预测卷练习` : '智能刷题练习'}
                </h1>
                {!isMobile && (
                  <p className="text-slate-600">
                    {isTaskMode ? currentTask?.description :
                     isExamMode ? `${examInfo?.date} ${examInfo?.segment || ''}` :
                     isPredictionMode ? `${predictionInfo?.date} ${predictionInfo?.segment || ''}` :
                     `欢迎，${user?.email}`}
                  </p>
                )}
                <div className={`flex items-center gap-4 ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                  {isTaskMode ? (
                    <>
                      <span className={`text-blue-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <Target className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                        任务进度：{currentTask?.completed_questions || 0}/{currentTask?.total_questions || 0}
                      </span>
                      <span className={`text-green-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <Award className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                        正确率：{currentTask?.completed_questions > 0 ? Math.round((currentTask?.correct_answers / currentTask?.completed_questions) * 100) : 0}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={`text-blue-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <Target className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                        题库总数：{totalQuestions} 道题
                      </span>
                      <span className={`text-green-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <CheckCircle className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                        已完成：{completedQuestions} 道题
                      </span>
                      <span className={`text-purple-600 flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <Award className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                        本次练习：{questions.length} 道题
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {(isTaskMode || isExamMode || isPredictionMode) && (
              <GlassButton
                variant="glass"
                size="sm"
                onClick={() => router.push(isTaskMode ? '/tasks' : '/exams')}
                className="text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                {isTaskMode ? '返回任务' : isPredictionMode ? '返回预测卷' : '返回考试'}
              </GlassButton>
            )}
          </div>
        </GlassCard>

        {/* 进度条 */}
        <GlassCard variant="light" className={isMobile ? 'mb-2' : 'mb-8'}>
          <div className={`flex justify-between items-center ${isMobile ? 'mb-2' : 'mb-4'}`}>
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
          <div className={`flex justify-between text-xs text-slate-500 ${isMobile ? 'mt-1' : 'mt-2'}`}>
            <span>开始</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% 完成</span>
            <span>结束</span>
          </div>
        </GlassCard>

        {/* 题目卡片 */}
        <GlassCard className={`relative overflow-hidden ${isMobile ? 'mb-2' : 'mb-8'}`}>
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <div className={isMobile ? 'mb-3' : 'mb-6'}>
              {/* 题目标签 - 优化布局，让题型提示与科目难度并排 */}
              <div className={`flex items-center gap-3 flex-wrap ${isMobile ? 'mb-3' : 'mb-6'}`}>
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
              <h2 className={`font-bold text-slate-800 leading-relaxed ${isMobile ? 'text-lg mb-3' : 'text-2xl mb-6'}`}>
                {currentQuestion.question}
              </h2>
            </div>

            {/* 选项 */}
            <div className={`${isMobile ? 'space-y-2 mb-4' : 'space-y-4 mb-8'}`}>
              {(() => {
                // 处理缺少选项的判断题
                let options = currentQuestion.options;

                // 选项格式化完成

                // 确保选项是对象格式
                if (typeof options === 'string') {
                  try {
                    options = JSON.parse(options);
                    console.log('解析后的选项:', options);
                  } catch (e) {
                    console.error('选项解析失败:', e, '原始数据:', options);
                    options = {};
                  }
                }

                // 确保options是一个有效的对象
                if (!options || typeof options !== 'object' || Array.isArray(options)) {
                  console.warn('选项数据格式异常，重置为空对象:', options);
                  options = {};
                }

                // 处理判断题的空选项
                if (questionType === 'trueOrFalse' && Object.keys(options).length === 0) {
                  options = { A: '正确', B: '错误' };
                }

                // 处理其他题型的空选项或异常选项
                if (Object.keys(options).length === 0 && questionType !== 'trueOrFalse') {
                  console.error('非判断题缺少选项数据，题目ID:', currentQuestion.id);
                  options = { A: '选项A', B: '选项B', C: '选项C', D: '选项D' };
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
              <>
                <GlassCard variant="light" className="border-l-4 border-green-500 bg-gradient-to-r from-green-50/50 to-blue-50/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg">正确答案: {currentQuestion.answer}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">{currentQuestion.explanation}</p>
                </GlassCard>

                {/* 错题掌握提示 */}
                {isWrongQuestionMastered && (
                  <GlassCard variant="light" className="border-l-4 border-purple-500 bg-gradient-to-r from-purple-50/50 to-pink-50/50 mt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">🎉</span>
                      </div>
                      <span className="font-bold text-purple-800 text-lg">恭喜！错题已掌握</span>
                    </div>
                    <p className="text-purple-700 leading-relaxed font-medium">
                      您答对了这道错题，说明已经掌握了相关知识点。这道题已从您的错题本中移除！
                    </p>
                  </GlassCard>
                )}
              </>
            )}
          </div>
        </GlassCard>

        {/* 导航按钮 */}
        {isMobile ? (
          // 移动端简化布局 - 只保留核心导航按钮
          <div className="flex gap-3">
            <GlassButton
              onClick={handlePrevQuestion}
              disabled={isFirstQuestion}
              variant="glass"
              size="lg"
              className="flex-1 text-slate-600 hover:text-slate-800"
            >
              <ChevronLeft className="h-5 w-5" />
              上一题
            </GlassButton>

            <GlassButton
              onClick={handleNextQuestion}
              disabled={!showExplanation}
              variant="primary"
              size="lg"
              className="flex-1"
            >
              {isLastQuestion ? (
                <>
                  <Award className="h-5 w-5" />
                  完成练习
                </>
              ) : (
                <>
                  下一题
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </GlassButton>
          </div>
        ) : (
          // 桌面端简化布局
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
        )}
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