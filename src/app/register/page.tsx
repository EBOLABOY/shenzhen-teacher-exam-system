'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, Key, Sparkles } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui/GlassCard'

export default function Register() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名'
    }

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6位字符'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    if (!formData.inviteCode.trim()) {
      newErrors.inviteCode = '请输入邀请码'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const verifyInviteCode = async (code: string) => {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_used', false)
      .single()

    if (error || !data) {
      return { valid: false, message: '邀请码无效或已被使用' }
    }

    // 检查是否过期
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, message: '邀请码已过期' }
    }

    return { valid: true, data }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})
    setSuccess('')

    try {
      // 1. 验证邀请码
      const inviteResult = await verifyInviteCode(formData.inviteCode)
      if (!inviteResult.valid) {
        setErrors({ inviteCode: inviteResult.message || '邀请码验证失败' })
        setLoading(false)
        return
      }

      // 2. 创建用户账户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.name
          }
        }
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('用户创建失败')
      }

      // 3. 创建用户配置
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          display_name: formData.name,
          is_admin: false
        })

      if (profileError) {
        console.error('创建用户配置失败:', profileError)
      }

      // 4. 初始化用户进度
      const { error: progressError } = await supabase
        .from('user_progress')
        .insert({
          user_id: authData.user.id,
          total_questions: 0,
          correct_answers: 0,
          total_time: 0,
          streak_days: 0,
          best_streak: 0
        })

      if (progressError) {
        console.error('初始化用户进度失败:', progressError)
      }

      // 5. 标记邀请码为已使用
      const { error: updateError } = await supabase
        .from('invite_codes')
        .update({
          used_by: authData.user.id,
          is_used: true,
          used_at: new Date().toISOString()
        })
        .eq('code', formData.inviteCode.toUpperCase())

      if (updateError) {
        console.error('更新邀请码状态失败:', updateError)
      }

      setSuccess('注册成功！请检查您的邮箱并点击确认链接来激活账户。')

      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/login')
      }, 3000)

    } catch (error: any) {
      console.error('注册失败:', error)
      setErrors({
        general: error.message || '注册失败，请稍后重试'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <GlassContainer maxWidth="md" className="w-full">
        <GlassCard className="max-w-md mx-auto">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-800">深圳教师考编</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              创建新账户
            </h2>
            <p className="text-slate-600">
              已有账户？{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                立即登录
              </Link>
            </p>
          </div>

          {/* 注册表单 */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {success && (
              <GlassCard variant="light" className="border-green-200 bg-green-50/50">
                <p className="text-sm text-green-600">{success}</p>
              </GlassCard>
            )}

            {errors.general && (
              <GlassCard variant="light" className="border-red-200 bg-red-50/50">
                <p className="text-sm text-red-600">{errors.general}</p>
              </GlassCard>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-700 mb-2">
                  邀请码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    value={formData.inviteCode}
                    onChange={handleChange}
                    className={`input-glass pl-10 uppercase ${
                      errors.inviteCode ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    placeholder="请输入邀请码"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                {errors.inviteCode && <p className="mt-1 text-sm text-red-600">{errors.inviteCode}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  需要邀请码才能注册，请联系管理员获取
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  姓名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-glass pl-10 ${
                      errors.name ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    placeholder="请输入您的姓名"
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-glass pl-10 ${
                      errors.email ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    placeholder="请输入邮箱地址"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-glass pl-10 pr-10 ${
                      errors.password ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    placeholder="请输入密码（至少6位）"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 transition-colors"
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
                  确认密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-glass pl-10 pr-10 ${
                      errors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                    placeholder="请再次输入密码"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 transition-colors"
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
                {loading ? '注册中...' : '注册'}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </GlassContainer>
    </div>
  )
}
