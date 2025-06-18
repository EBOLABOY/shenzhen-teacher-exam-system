'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 获取URL中的认证参数
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setMessage(errorDescription || '认证失败，请重试')
          return
        }

        if (code) {
          // 处理OAuth回调
          const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (authError) {
            setStatus('error')
            setMessage('认证失败：' + authError.message)
            return
          }

          if (data.user) {
            // 检查用户配置是否存在
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('is_admin')
              .eq('user_id', data.user.id)
              .single()

            setStatus('success')
            setMessage('登录成功！正在跳转...')

            // 根据用户类型跳转
            setTimeout(() => {
              if (profile?.is_admin) {
                router.push('/admin')
              } else {
                router.push('/practice')
              }
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage('缺少认证参数')
        }
      } catch (error: any) {
        console.error('认证回调处理失败:', error)
        setStatus('error')
        setMessage('认证处理失败：' + (error.message || '未知错误'))
      }
    }

    handleAuthCallback()
  }, [searchParams, router, supabase])

  const handleRetry = () => {
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
              正在处理认证
            </h2>
          </div>

          <div className="space-y-6">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-600">正在验证您的身份...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <p className="text-green-600 font-medium">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="w-12 h-12 text-red-600" />
                <p className="text-red-600 font-medium">{message}</p>
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

export default function AuthCallback() {
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
                正在加载认证页面
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
      <AuthCallbackContent />
    </Suspense>
  )
}
