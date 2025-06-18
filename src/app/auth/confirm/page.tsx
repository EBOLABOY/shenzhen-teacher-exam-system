'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import { CheckCircle, XCircle, Loader2, Sparkles, Mail } from 'lucide-react'

function AuthConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // 获取URL中的确认参数
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || '邮件确认失败，请重试')
          return
        }

        if (token && type) {
          // 处理邮件确认
          const { data, error: confirmError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any
          })
          
          if (confirmError) {
            setStatus('error')
            setMessage('邮件确认失败：' + confirmError.message)
            return
          }

          if (data.user) {
            // 确认成功，检查用户配置
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single()

            // 如果没有用户配置，创建一个
            if (!profile) {
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: data.user.id,
                  display_name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || '用户',
                  is_admin: false
                })

              if (profileError) {
                console.error('创建用户配置失败:', profileError)
              }

              // 初始化用户进度
              const { error: progressError } = await supabase
                .from('user_progress')
                .insert({
                  user_id: data.user.id,
                  total_questions: 0,
                  correct_answers: 0,
                  total_time: 0,
                  streak_days: 0,
                  best_streak: 0
                })

              if (progressError) {
                console.error('初始化用户进度失败:', progressError)
              }
            }

            setStatus('success')
            setMessage('邮箱验证成功！您的账户已激活，正在跳转到登录页面...')

            // 3秒后跳转到登录页面
            setTimeout(() => {
              router.push('/login')
            }, 3000)
          }
        } else {
          setStatus('error')
          setMessage('缺少确认参数')
        }
      } catch (error: any) {
        console.error('邮件确认处理失败:', error)
        setStatus('error')
        setMessage('邮件确认处理失败：' + (error.message || '未知错误'))
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router, supabase])

  const handleRetry = () => {
    router.push('/register')
  }

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <GlassContainer maxWidth="md" className="w-full">
        <GlassCard className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-800">深圳教师考编</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              邮箱验证
            </h2>
          </div>

          <div className="space-y-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-600">正在验证您的邮箱...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                  <Mail className="w-6 h-6 text-white absolute top-3 left-3" />
                </div>
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">邮箱验证成功！</p>
                  <p className="text-slate-600 text-sm">{message}</p>
                </div>
                <GlassButton
                  variant="primary"
                  onClick={handleLogin}
                  className="mt-4"
                >
                  立即登录
                </GlassButton>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="w-12 h-12 text-red-600" />
                <div className="space-y-2">
                  <p className="text-red-600 font-medium">验证失败</p>
                  <p className="text-slate-600 text-sm">{message}</p>
                </div>
                <div className="flex gap-3">
                  <GlassButton
                    variant="secondary"
                    onClick={handleRetry}
                  >
                    重新注册
                  </GlassButton>
                  <GlassButton
                    variant="primary"
                    onClick={handleLogin}
                  >
                    返回登录
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </GlassContainer>
    </div>
  )
}

export default function AuthConfirm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <GlassContainer maxWidth="md" className="w-full">
          <GlassCard className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-slate-800">深圳教师考编</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                正在加载验证页面
              </h2>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-slate-600">请稍候...</p>
            </div>
          </GlassCard>
        </GlassContainer>
      </div>
    }>
      <AuthConfirmContent />
    </Suspense>
  )
}
