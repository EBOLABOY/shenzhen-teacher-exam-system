'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui/GlassCard'
import { 
  CheckCircle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  TrendingUp, 
  BookOpen, 
  Target,
  Calendar,
  BarChart3,
  ArrowLeft
} from 'lucide-react'

interface PracticeTask {
  id: string
  user_id: string
  task_type: string
  title: string
  description: string
  question_ids: string[]
  total_questions: number
  completed_questions: number
  correct_answers: number
  status: 'pending' | 'in_progress' | 'completed' | 'paused'
  difficulty_distribution: Record<string, number>
  subject_distribution: Record<string, number>
  estimated_time: number
  actual_time?: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export default function TasksPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [tasks, setTasks] = useState<PracticeTask[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

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
      await fetchTasks(user.id)
    } catch (error) {
      console.error('用户验证失败:', error)
      router.push('/login')
    }
  }

  const fetchTasks = async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('practice_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('获取任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const startTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('practice_tasks')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // 跳转到练习页面
      router.push(`/practice?task_id=${taskId}`)
    } catch (error) {
      console.error('开始任务失败:', error)
      alert('开始任务失败，请重试')
    }
  }

  const pauseTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('practice_tasks')
        .update({ status: 'paused' })
        .eq('id', taskId)

      if (error) throw error
      
      await fetchTasks(user.id)
    } catch (error) {
      console.error('暂停任务失败:', error)
      alert('暂停任务失败，请重试')
    }
  }

  const resumeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('practice_tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId)

      if (error) throw error
      
      // 跳转到练习页面
      router.push(`/practice?task_id=${taskId}`)
    } catch (error) {
      console.error('恢复任务失败:', error)
      alert('恢复任务失败，请重试')
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？此操作不可恢复。')) {
      return
    }

    try {
      const { error } = await supabase
        .from('practice_tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      
      await fetchTasks(user.id)
    } catch (error) {
      console.error('删除任务失败:', error)
      alert('删除任务失败，请重试')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待开始'
      case 'in_progress': return '进行中'
      case 'completed': return '已完成'
      case 'paused': return '已暂停'
      default: return '未知'
    }
  }

  const getTaskTypeText = (taskType: string) => {
    switch (taskType) {
      case 'wrong_questions_review': return '错题复习'
      case 'subject_practice': return '科目练习'
      case 'difficulty_practice': return '难度练习'
      case 'random_practice': return '随机练习'
      default: return '练习任务'
    }
  }

  const calculateAccuracy = (task: PracticeTask) => {
    if (task.completed_questions === 0) return 0
    return Math.round((task.correct_answers / task.completed_questions) * 100)
  }

  const calculateProgress = (task: PracticeTask) => {
    if (task.total_questions === 0) return 0
    return Math.round((task.completed_questions / task.total_questions) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">加载任务中...</p>
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
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">我的练习任务</h1>
                <p className="text-slate-600 mt-2">管理和跟踪您的学习进度</p>
              </div>
            </div>

          </div>
        </GlassCard>

        {/* 统计概览 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">总任务</h3>
            <p className="text-3xl font-bold text-blue-600">{tasks.length}</p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">进行中</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {tasks.filter(t => t.status === 'in_progress' || t.status === 'paused').length}
            </p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">已完成</h3>
            <p className="text-3xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">平均准确率</h3>
            <p className="text-3xl font-bold text-purple-600">
              {tasks.length > 0 
                ? Math.round(tasks.reduce((acc, task) => acc + calculateAccuracy(task), 0) / tasks.length)
                : 0
              }%
            </p>
          </GlassCard>
        </div>

        {/* 筛选器 */}
        <GlassCard variant="light" className="mb-8">
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '待开始' },
              { key: 'in_progress', label: '进行中' },
              { key: 'completed', label: '已完成' }
            ].map(({ key, label }) => (
              <GlassButton
                key={key}
                onClick={() => setFilter(key as any)}
                variant={filter === key ? 'primary' : 'glass'}
                size="sm"
              >
                {label}
              </GlassButton>
            ))}
          </div>
        </GlassCard>

        {/* 任务列表 */}
        {filteredTasks.length === 0 ? (
          <GlassCard className="text-center py-12">
            <Target className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">暂无任务</h3>
            <p className="text-slate-500 mb-6">
              {filter === 'all' ? '您还没有创建任何练习任务' : `暂无${getStatusText(filter)}的任务`}
            </p>
            <GlassButton
              onClick={() => router.push('/wrong-questions')}
              variant="primary"
              size="md"
            >
              创建错题复习任务
            </GlassButton>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {filteredTasks.map((task) => (
              <GlassCard key={task.id} className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-800">{task.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                        <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                          {getTaskTypeText(task.task_type)}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-4">{task.description}</p>
                      
                      {/* 进度信息 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-slate-500">进度</div>
                          <div className="font-bold text-slate-800">
                            {task.completed_questions}/{task.total_questions} ({calculateProgress(task)}%)
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">准确率</div>
                          <div className="font-bold text-slate-800">{calculateAccuracy(task)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">预计时间</div>
                          <div className="font-bold text-slate-800">{task.estimated_time}分钟</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-500">创建时间</div>
                          <div className="font-bold text-slate-800">
                            {new Date(task.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* 进度条 */}
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(task)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <GlassButton
                        onClick={() => startTask(task.id)}
                        variant="primary"
                        size="sm"
                      >
                        <Play className="w-4 h-4" />
                        开始
                      </GlassButton>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <>
                        <GlassButton
                          onClick={() => resumeTask(task.id)}
                          variant="primary"
                          size="sm"
                        >
                          <Play className="w-4 h-4" />
                          继续
                        </GlassButton>
                        <GlassButton
                          onClick={() => pauseTask(task.id)}
                          variant="glass"
                          size="sm"
                        >
                          <Pause className="w-4 h-4" />
                          暂停
                        </GlassButton>
                      </>
                    )}
                    
                    {task.status === 'paused' && (
                      <GlassButton
                        onClick={() => resumeTask(task.id)}
                        variant="primary"
                        size="sm"
                      >
                        <Play className="w-4 h-4" />
                        继续
                      </GlassButton>
                    )}
                    
                    {task.status === 'completed' && (
                      <GlassButton
                        onClick={() => router.push(`/practice?task_id=${task.id}&mode=review`)}
                        variant="glass"
                        size="sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        查看结果
                      </GlassButton>
                    )}
                    
                    <GlassButton
                      onClick={() => deleteTask(task.id)}
                      variant="glass"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </GlassContainer>
    </div>
  )
}
