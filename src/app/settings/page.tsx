'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Info,
  LogOut,
  ChevronRight,
  Mail,
  Calendar,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [progressInfo, setProgressInfo] = useState<any>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProgressInfo()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('用户验证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgressInfo = async () => {
    try {
      const response = await fetch('/api/user-progress/reset')
      if (response.ok) {
        const result = await response.json()
        setProgressInfo(result.data)
      }
    } catch (error) {
      console.error('获取进度信息失败:', error)
    }
  }

  const handleResetProgress = async (resetType: string) => {
    const confirmCode = prompt('请输入确认码 "RESET_MY_PROGRESS" 来确认重置操作：')
    if (confirmCode !== 'RESET_MY_PROGRESS') {
      alert('确认码错误，操作已取消')
      return
    }

    setResetLoading(true)
    try {
      const response = await fetch('/api/user-progress/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetType,
          confirmCode
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`重置成功！删除了 ${result.deletedRecords} 条记录`)
        setShowResetModal(false)
        fetchProgressInfo() // 刷新进度信息
      } else {
        alert(`重置失败：${result.error}`)
      }
    } catch (error) {
      console.error('重置失败:', error)
      alert('重置操作失败，请稍后重试')
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  const settingsGroups = [
    {
      title: '账户设置',
      items: [
        {
          icon: User,
          title: '个人信息',
          description: '管理您的个人资料和偏好',
          action: () => alert('个人信息设置功能开发中...')
        },
        {
          icon: Shield,
          title: '安全设置',
          description: '密码、两步验证等安全选项',
          action: () => alert('安全设置功能开发中...')
        }
      ]
    },
    {
      title: '应用设置',
      items: [
        {
          icon: Bell,
          title: '通知设置',
          description: '管理推送通知和提醒',
          action: () => alert('通知设置功能开发中...')
        },
        {
          icon: Palette,
          title: '主题设置',
          description: '选择您喜欢的界面主题',
          action: () => alert('主题设置功能开发中...')
        }
      ]
    },
    {
      title: '数据管理',
      items: [
        {
          icon: Database,
          title: '数据导出',
          description: '导出您的学习数据和进度',
          action: () => alert('数据导出功能开发中...')
        },
        {
          icon: Database,
          title: '清除数据',
          description: '清除本地缓存和临时数据',
          action: () => {
            if (confirm('确定要清除本地数据吗？这将清除缓存但不会影响您的账户数据。')) {
              localStorage.clear()
              sessionStorage.clear()
              alert('本地数据已清除')
            }
          }
        },
        {
          icon: RotateCcw,
          title: '重置学习进度',
          description: '重置答题记录和错题本（谨慎操作）',
          action: () => setShowResetModal(true),
          danger: true
        }
      ]
    },
    {
      title: '关于',
      items: [
        {
          icon: Info,
          title: '关于应用',
          description: '版本信息和使用条款',
          action: () => alert('深圳教师考编刷题系统 v1.0.0\n\n开发团队：AI助手\n更新时间：2024年')
        }
      ]
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">加载设置中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GlassContainer maxWidth="2xl" className="py-8">
        {/* 页面标题 */}
        <GlassCard className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">设置</h1>
              <p className="text-slate-600 mt-2">管理您的账户和应用偏好</p>
            </div>
          </div>
        </GlassCard>

        {/* 用户信息卡片 */}
        <GlassCard className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800">用户账户</h3>
              <div className="flex items-center gap-2 text-slate-600 mt-1">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 mt-1">
                <Calendar className="w-4 h-4" />
                <span>注册时间：{new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 设置组 */}
        <div className="space-y-8">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h2 className="text-lg font-bold text-slate-800 mb-4">{group.title}</h2>
              <div className="space-y-3">
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon
                  return (
                    <GlassCard key={itemIndex} className="hover:shadow-lg transition-all duration-200">
                      <button
                        onClick={item.action}
                        className="w-full flex items-center gap-4 text-left"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          item.danger
                            ? 'bg-gradient-to-r from-red-100 to-red-200'
                            : 'bg-gradient-to-r from-slate-100 to-slate-200'
                        }`}>
                          <Icon className={`w-6 h-6 ${item.danger ? 'text-red-600' : 'text-slate-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold ${item.danger ? 'text-red-800' : 'text-slate-800'}`}>
                            {item.title}
                          </h3>
                          <p className={`text-sm ${item.danger ? 'text-red-600' : 'text-slate-600'}`}>
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className={`w-5 h-5 ${item.danger ? 'text-red-400' : 'text-slate-400'}`} />
                      </button>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 退出登录 */}
        <GlassCard className="mt-8 border-red-200 bg-red-50/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 text-left"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <LogOut className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800">退出登录</h3>
              <p className="text-red-600 text-sm">退出当前账户</p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </GlassCard>

        {/* 版本信息 */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>深圳教师考编刷题系统 v1.0.0</p>
          <p className="mt-1">© 2024 AI助手开发</p>
        </div>
      </GlassContainer>

      {/* 重置进度模态框 */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">重置学习进度</h2>
              <p className="text-slate-600">
                此操作将删除您的学习记录，请谨慎选择
              </p>
            </div>

            {progressInfo && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm">
                <h3 className="font-bold text-slate-700 mb-2">当前进度统计：</h3>
                <div className="space-y-1 text-slate-600">
                  <p>• 答题记录：{progressInfo.answers_count} 条</p>
                  <p>• 错题记录：{progressInfo.wrong_questions_count} 条</p>
                  <p>• 练习任务：{progressInfo.tasks_count} 个</p>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleResetProgress('answers')}
                disabled={resetLoading}
                className="w-full p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <div className="font-medium text-orange-800">仅重置答题记录</div>
                <div className="text-sm text-orange-600">清除答题历史，保留错题本</div>
              </button>

              <button
                onClick={() => handleResetProgress('wrong_questions')}
                disabled={resetLoading}
                className="w-full p-3 text-left bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors"
              >
                <div className="font-medium text-yellow-800">仅重置错题本</div>
                <div className="text-sm text-yellow-600">清除错题记录，保留答题历史</div>
              </button>

              <button
                onClick={() => handleResetProgress('all')}
                disabled={resetLoading}
                className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
              >
                <div className="font-medium text-red-800">完全重置</div>
                <div className="text-sm text-red-600">清除所有学习数据和进度</div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetLoading}
                className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>

            {resetLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-slate-600">正在重置...</p>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  )
}
