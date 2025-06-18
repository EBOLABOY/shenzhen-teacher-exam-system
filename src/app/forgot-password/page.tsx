'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, Sparkles } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (error: any) {
      console.error('发送重置邮件失败:', error)
      setError(error.message || '发送重置邮件失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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
                邮件已发送
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">重置邮件已发送！</p>
                  <p className="text-slate-600 text-sm">
                    我们已向 <span className="font-medium">{email}</span> 发送了密码重置邮件。
                  </p>
                  <p className="text-slate-600 text-sm">
                    请检查您的邮箱（包括垃圾邮件文件夹），并点击邮件中的链接来重置密码。
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <GlassButton
                  variant="primary"
                  onClick={() => router.push('/login')}
                >
                  返回登录
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={() => setSuccess(false)}
                >
                  重新发送
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </GlassContainer>
      </div>
    )
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
              忘记密码
            </h2>
            <p className="text-slate-600">
              输入您的邮箱地址，我们将发送密码重置链接给您
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <GlassCard variant="light" className="border-red-200 bg-red-50/50">
                <p className="text-sm text-red-600">{error}</p>
              </GlassCard>
            )}

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
                  placeholder="请输入您的邮箱地址"
                />
              </div>
            </div>

            <div className="space-y-4">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading ? '发送中...' : '发送重置邮件'}
              </GlassButton>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回登录
                </Link>
              </div>
            </div>
          </form>
        </GlassCard>
      </GlassContainer>
    </div>
  )
}
