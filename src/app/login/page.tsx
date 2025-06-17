'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui/GlassCard'

export default function Login() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', data.user.id)
          .single()

        if (profile?.is_admin) {
          router.push('/admin')
        } else {
          router.push('/practice')
        }
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      setError(error.message || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <GlassContainer maxWidth="md" className="w-full">
        <GlassCard className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-800">深圳教师考编</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              登录您的账户
            </h2>
            <p className="text-slate-600">
              还没有账户？{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
                立即注册
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <GlassCard variant="light" className="border-red-200 bg-red-50/50">
                <p className="text-sm text-red-600">{error}</p>
              </GlassCard>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-glass pl-10"
                    placeholder="请输入邮箱地址"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-glass pl-10 pr-10"
                    placeholder="请输入密码"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                  忘记密码？
                </a>
              </div>
            </div>

            <div className="pt-4">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading ? '登录中...' : '登录'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </GlassContainer>
    </div>
  )
}
