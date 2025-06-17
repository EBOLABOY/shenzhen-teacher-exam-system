'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, TrendingUp, Clock, LogOut, Brain, AlertTriangle, Sparkles, Target, Award, Zap } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassNav, GlassContainer, LoadingGlass } from '@/components/ui'

export default function Home() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // 获取用户配置
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setUserProfile(profile)
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingGlass message="正在加载..." />
      </div>
    )
  }

  console.log('User:', user)
  console.log('UserProfile:', userProfile)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <GlassContainer maxWidth="2xl" className="text-center py-20">
        <div className="relative">
          {/* 背景装饰 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse delay-2000"></div>
          </div>

          <div className="float-animation">
            <h1 className="text-6xl font-bold text-slate-800 mb-6 leading-tight">
              深圳教师考编
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                智能刷题系统
              </span>
            </h1>
          </div>

          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            专业的教师考试题库，AI智能分析薄弱知识点
            <br />
            助您高效备考，顺利通过深圳教师考编
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <GlassButton variant="primary" size="lg" href="/login">
                <Zap className="w-5 h-5" />
                立即登录
              </GlassButton>
              <GlassButton variant="glass" size="lg" href="/register">
                <Sparkles className="w-5 h-5" />
                免费注册
              </GlassButton>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <GlassButton variant="primary" size="lg" href="/practice">
                <BookOpen className="w-5 h-5" />
                开始刷题
              </GlassButton>
              <GlassButton variant="secondary" size="lg" href="/wrong-questions">
                <Brain className="w-5 h-5" />
                AI错题分析
              </GlassButton>
              {userProfile?.is_admin && (
                <GlassButton variant="accent" size="lg" href="/admin">
                  <Users className="w-5 h-5" />
                  管理后台
                </GlassButton>
              )}
            </div>
          )}
        </div>
      </GlassContainer>

      {/* Features */}
      <GlassContainer maxWidth="2xl" className="mb-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            为什么选择我们？
          </h2>
          <p className="text-slate-600 text-lg">
            专业、智能、高效的学习体验
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <GlassCard hover glow className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">丰富题库</h3>
            <p className="text-slate-600 leading-relaxed">
              涵盖历年真题和模拟题，全面覆盖考试要点，助您全方位备考
            </p>
          </GlassCard>

          <GlassCard hover glow className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">AI智能分析</h3>
            <p className="text-slate-600 leading-relaxed">
              智能分析薄弱知识点，提供个性化学习建议，精准提升学习效果
            </p>
          </GlassCard>

          <GlassCard hover glow className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">智能错题库</h3>
            <p className="text-slate-600 leading-relaxed">
              自动收集错题，支持重做和掌握标记，让学习更有针对性
            </p>
          </GlassCard>

          <GlassCard hover glow className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">学习分析</h3>
            <p className="text-slate-600 leading-relaxed">
              详细的答题统计和进度分析，实时掌握学习状态
            </p>
          </GlassCard>

          <GlassCard hover glow className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">学习记录</h3>
            <p className="text-slate-600 leading-relaxed">
              完整的学习轨迹记录，随时查看进度和成长历程
            </p>
          </GlassCard>

          <GlassCard hover glow className="text-center group">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-teal-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-4">精准备考</h3>
            <p className="text-slate-600 leading-relaxed">
              针对性练习，高效备考，助您顺利通过教师考编
            </p>
          </GlassCard>
        </div>
      </GlassContainer>

      {/* Stats */}
      <GlassContainer maxWidth="2xl" className="mb-20">
        <GlassCard variant="light" className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-12">平台数据</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                1000+
              </div>
              <div className="text-slate-700 text-lg font-medium">精选题目</div>
              <div className="text-slate-500 text-sm mt-2">覆盖全部考点</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                500+
              </div>
              <div className="text-slate-700 text-lg font-medium">注册用户</div>
              <div className="text-slate-500 text-sm mt-2">共同进步</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300">
                95%
              </div>
              <div className="text-slate-700 text-lg font-medium">通过率</div>
              <div className="text-slate-500 text-sm mt-2">值得信赖</div>
            </div>
          </div>
        </GlassCard>
      </GlassContainer>

      {/* CTA */}
      <GlassContainer maxWidth="lg" className="text-center">
        <GlassCard variant="light" glow className="relative overflow-hidden">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
          <div className="relative z-10">
            <Award className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
              立即注册，开始您的教师考编备考之旅
              <br />
              与数百名考生一起，迈向成功！
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <GlassButton variant="primary" size="lg" href="/register">
                  <Sparkles className="w-5 h-5" />
                  立即开始
                </GlassButton>
                <GlassButton variant="glass" size="lg" href="/login">
                  已有账号？登录
                </GlassButton>
              </div>
            )}
          </div>
        </GlassCard>
      </GlassContainer>

      {/* Footer */}
      <footer className="mt-20 py-12">
        <GlassContainer maxWidth="2xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-slate-600" />
              <span className="text-slate-700 font-bold text-xl">深圳教师考编刷题系统</span>
            </div>
            <p className="text-slate-500 mb-6">
              专业 · 智能 · 高效
            </p>
            <div className="flex justify-center gap-8 text-slate-400 text-sm">
              <span>© 2024 深圳教师考编系统</span>
              <span>·</span>
              <span>专注教师考编备考</span>
              <span>·</span>
              <span>AI智能分析</span>
            </div>
          </div>
        </GlassContainer>
      </footer>
    </div>
  )
}
