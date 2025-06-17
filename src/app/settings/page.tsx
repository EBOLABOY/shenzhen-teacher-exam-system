'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui/GlassCard'
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
  Calendar
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('用户验证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
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
                        <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                          <Icon className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800">{item.title}</h3>
                          <p className="text-slate-600 text-sm">{item.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400" />
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
    </div>
  )
}
