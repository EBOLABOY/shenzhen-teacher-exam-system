'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import { CheckCircle, XCircle, Loader2, Sparkles, Lock, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // 获取URL中的重置参数
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || '密码重置链接无效或已过期')
          return
        }

        if (accessToken && refreshToken) {
          // 设置会话
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            setStatus('error')
            setMessage('密码重置链接无效：' + sessionError.message)
            return
          }

          if (data.user) {
            setStatus('form')
            setMessage('请设置您的新密码')
          }
        } else {
          setStatus('error')
          setMessage('缺少重置参数')
        }
      } catch (error: any) {
        console.error('密码重置检查失败:', error)
        setStatus('error')
        setMessage('密码重置处理失败：' + (error.message || '未知错误'))
      }
    }

    checkResetToken()
  }, [searchParams, supabase])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!password) {
      newErrors.password = '请输入新密码'
    } else if (password.length < 6) {
      newErrors.password = '密码长度至少6位'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认新密码'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setStatus('success')
      setMessage('密码重置成功！正在跳转到登录页面...')

      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error: any) {
      console.error('密码重置失败:', error)
      setErrors({ submit: error.message || '密码重置失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    router.push('/login')
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
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              重置密码
            </h2>
            {status === 'form' && (
              <p className="text-slate-600">{message}</p>
            )}
          </div>

          <div className="space-y-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-600">正在验证重置链接...</p>
              </div>
            )}

            {status === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.submit && (
                  <GlassCard variant="light" className="border-red-200 bg-red-50/50">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </GlassCard>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-glass pl-10 pr-10"
                        placeholder="请输入新密码"
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
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                      确认新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-glass pl-10 pr-10"
                        placeholder="请再次输入新密码"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-slate-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-slate-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
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
                    {loading ? '重置中...' : '重置密码'}
                  </GlassButton>
                </div>
              </form>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">密码重置成功！</p>
                  <p className="text-slate-600 text-sm">{message}</p>
                </div>
                <GlassButton
                  variant="primary"
                  onClick={() => router.push('/login')}
                  className="mt-4"
                >
                  立即登录
                </GlassButton>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4 text-center">
                <XCircle className="w-12 h-12 text-red-600" />
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">重置失败</p>
                  <p className="text-slate-600 text-sm">{message}</p>
                </div>
                <GlassButton
                  variant="primary"
                  onClick={handleRetry}
                  className="mt-4"
                >
                  返回登录
                </GlassButton>
              </div>
            )}
          </div>
        </GlassCard>
      </GlassContainer>
    </div>
  )
}
