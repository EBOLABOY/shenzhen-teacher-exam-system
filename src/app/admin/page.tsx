'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Database, FileText, BarChart3, Key, Users, Plus, Copy, Check, Sparkles, Settings, Shield, AlertTriangle, Edit, Trash2, UserCheck, UserX, Mail, Calendar, Activity } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import ImportTool from './import-tool'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [stats, setStats] = useState<any>(null)
  const [inviteCodes, setInviteCodes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [fixPredictionsLoading, setFixPredictionsLoading] = useState(false)
  const [fixPredictionsResult, setFixPredictionsResult] = useState<any>(null)

  // 生成邀请码
  const generateInviteCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // 获取统计信息
  const fetchStats = async () => {
    try {
      // 获取题目总数（使用count查询，更高效）
      const { count, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError

      // 获取前几道题目用于预览（限制数量以提高性能）
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .limit(10)
        .order('created_at', { ascending: false })

      if (questionsError) throw questionsError

      setStats({
        total: count || 0,
        questions: questions || []
      })
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  // 获取邀请码列表
  const fetchInviteCodes = async () => {
    try {
      const response = await fetch('/api/invite-codes')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '获取邀请码失败')
      }

      setInviteCodes(result.inviteCodes || [])
    } catch (error) {
      console.error('获取邀请码失败:', error)
    }
  }

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      console.log('开始获取用户列表...')

      // 使用API端点获取用户列表，避免RLS问题
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '获取用户列表失败')
      }

      const result = await response.json()
      console.log('获取到的用户数据:', result.users)

      setUsers(result.users || [])
    } catch (error) {
      console.error('获取用户列表失败:', error)
      console.error('错误详情:', JSON.stringify(error, null, 2))

      // 如果API失败，尝试直接查询（用于开发环境）
      try {
        console.log('尝试直接查询数据库...')

        // 分别查询用户配置和用户进度
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profilesError) {
          console.error('查询用户配置失败:', profilesError)
          setUsers([])
          return
        }

        console.log('获取到用户配置:', profiles)

        // 获取用户进度
        if (profiles && profiles.length > 0) {
          const userIds = profiles.map(p => p.user_id)
          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .in('user_id', userIds)

          if (progressError) {
            console.warn('获取用户进度失败:', progressError)
          }

          // 合并数据
          const usersWithProgress = profiles.map(profile => ({
            ...profile,
            user_progress: progressData?.filter(p => p.user_id === profile.user_id) || []
          }))

          setUsers(usersWithProgress)
        } else {
          setUsers(profiles || [])
        }
      } catch (fallbackError) {
        console.error('备用查询失败:', fallbackError)
        setUsers([])
      }
    }
  }

  // 创建新邀请码
  const createInviteCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '创建邀请码失败')
      }

      alert('邀请码创建成功！')
      await fetchInviteCodes()
    } catch (error) {
      console.error('创建邀请码失败:', error)
      alert(`创建邀请码失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  // 复制邀请码
  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(''), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // 同步所有用户进度统计
  const syncAllUserProgress = async () => {
    setSyncLoading(true)
    setSyncResult(null)
    try {
      const response = await fetch('/api/admin/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '同步失败')
      }

      setSyncResult(result)
      alert(`同步完成：成功 ${result.summary.success} 个，失败 ${result.summary.error} 个`)

      // 重新获取用户列表以显示最新数据
      await fetchUsers()
    } catch (error) {
      console.error('同步用户进度失败:', error)
      alert(`同步失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSyncLoading(false)
    }
  }

  // 修复预测卷数据
  const fixPredictionsData = async () => {
    setFixPredictionsLoading(true)
    setFixPredictionsResult(null)

    try {
      const response = await fetch('/api/admin/fix-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '修复失败')
      }

      setFixPredictionsResult(result)

      if (result.success) {
        alert(`预测卷修复成功！导入了 ${result.data.totalQuestions} 道题目`)
        // 重新获取统计数据
        await fetchStats()
      } else {
        alert(`修复失败: ${result.message}`)
      }
    } catch (error) {
      console.error('修复预测卷失败:', error)
      alert(`修复失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setFixPredictionsLoading(false)
    }
  }

  // 更新用户权限
  const updateUserRole = async (userId: string, isAdmin: boolean) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: isAdmin })
        .eq('user_id', userId)

      if (error) throw error

      alert(`用户权限更新成功！`)
      await fetchUsers()
    } catch (error) {
      console.error('更新用户权限失败:', error)
      alert(`更新用户权限失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  // 删除用户
  const deleteUser = async (userId: string, displayName: string) => {
    if (!confirm(`确定要删除用户 "${displayName}" 吗？此操作不可恢复！`)) {
      return
    }

    setLoading(true)
    try {
      // 删除用户相关数据
      await supabase.from('user_answers').delete().eq('user_id', userId)
      await supabase.from('user_progress').delete().eq('user_id', userId)
      await supabase.from('wrong_questions').delete().eq('user_id', userId)
      await supabase.from('user_profiles').delete().eq('user_id', userId)

      alert('用户删除成功！')
      await fetchUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      alert(`删除用户失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  // 编辑用户
  const editUser = (user: any) => {
    setEditingUser(user)
    setShowUserModal(true)
  }

  // 保存用户编辑
  const saveUserEdit = async () => {
    if (!editingUser) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: editingUser.display_name,
          is_admin: editingUser.is_admin
        })
        .eq('user_id', editingUser.user_id)

      if (error) throw error

      alert('用户信息更新成功！')
      setShowUserModal(false)
      setEditingUser(null)
      await fetchUsers()
    } catch (error) {
      console.error('更新用户信息失败:', error)
      alert(`更新用户信息失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  // 过滤用户列表
  const filteredUsers = users.filter(user => {
    const matchesFilter = userFilter === 'all' ||
                         (userFilter === 'admin' && user.is_admin) ||
                         (userFilter === 'user' && !user.is_admin)

    const matchesSearch = searchTerm === '' ||
                         user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // 检查用户权限
  useEffect(() => {
    checkAdminAccess()
  }, [])

  // 页面加载时获取数据
  useEffect(() => {
    if (isAdmin) {
      fetchStats()
      fetchInviteCodes()
      fetchUsers()
    }
  }, [isAdmin])

  const checkAdminAccess = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // 检查用户是否为管理员
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile?.is_admin) {
        // 不是管理员，重定向到主页
        router.push('/')
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('权限检查失败:', error)
      router.push('/')
    } finally {
      setAuthLoading(false)
    }
  }

  // 权限验证加载中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center p-8">
          <Shield className="w-16 h-16 animate-pulse text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-600 mb-2">验证管理员权限</h3>
          <p className="text-slate-500">正在检查访问权限...</p>
        </GlassCard>
      </div>
    )
  }

  // 非管理员用户
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-600 mb-2">访问被拒绝</h3>
          <p className="text-slate-500 mb-6">您没有权限访问管理后台</p>
          <GlassButton
            onClick={() => router.push('/')}
            variant="primary"
            size="md"
          >
            返回主页
          </GlassButton>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GlassContainer maxWidth="2xl" className="py-8">
        {/* 页面标题 */}
        <GlassCard className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-purple-600" />
                系统管理中心
              </h1>
              <p className="text-slate-600 mt-2">
                深圳教师考编系统 - 管理题库、用户和邀请码
              </p>
            </div>
          </div>
        </GlassCard>

        {/* 标签页导航 */}
        <GlassCard variant="light" className="mb-8">
          <nav className="flex space-x-2">
            <GlassButton
              onClick={() => setActiveTab('dashboard')}
              variant={activeTab === 'dashboard' ? 'primary' : 'glass'}
              size="md"
              className="flex-1"
            >
              <Database className="w-4 h-4" />
              题库管理
            </GlassButton>
            <GlassButton
              onClick={() => setActiveTab('invites')}
              variant={activeTab === 'invites' ? 'primary' : 'glass'}
              size="md"
              className="flex-1"
            >
              <Key className="w-4 h-4" />
              邀请码管理
            </GlassButton>
            <GlassButton
              onClick={() => setActiveTab('users')}
              variant={activeTab === 'users' ? 'primary' : 'glass'}
              size="md"
              className="flex-1"
            >
              <Users className="w-4 h-4" />
              用户管理
            </GlassButton>
          </nav>
        </GlassCard>

        {/* 题库管理标签页 */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <GlassCard className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">题目总数</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats ? stats.total : '加载中...'}
                </p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">用户总数</h3>
                <p className="text-3xl font-bold text-green-600">{users.length}</p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">可用邀请码</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {inviteCodes.filter(code => !code.is_used).length}
                </p>
                <p className="text-sm text-slate-500">张</p>
              </GlassCard>

              <GlassCard className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">导入状态</h3>
                <p className="text-lg font-bold text-purple-600">就绪</p>
              </GlassCard>
            </div>

            {/* 导入工具 */}
            <div className="mb-8">
              <ImportTool onImportComplete={fetchStats} />
            </div>

            {/* 题目预览 */}
            {stats && stats.questions && stats.questions.length > 0 && (
              <GlassCard>
                <h2 className="text-xl font-bold text-slate-800 mb-6">最新题目预览</h2>
                <div className="space-y-6">
                  {stats.questions.slice(0, 3).map((question: any, index: number) => (
                    <GlassCard key={index} variant="light" className="relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-full">
                            {question.subject}
                          </span>
                          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                            question.difficulty === 'easy' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                            question.difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                            'bg-gradient-to-r from-red-500 to-red-600 text-white'
                          }`}>
                            {question.difficulty === 'easy' ? '简单' :
                             question.difficulty === 'medium' ? '中等' : '困难'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-4 text-lg">{question.question}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                          {Object.entries(question.options).map(([key, value]: [string, any]) => (
                            <div key={key} className={`p-3 rounded-lg border-2 transition-all ${
                              question.answer === key
                                ? 'border-green-500 bg-green-50 text-green-800'
                                : 'border-slate-200 bg-slate-50'
                            }`}>
                              <span className="font-bold">{key}.</span> {value}
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <GlassCard variant="light" className="border-l-4 border-blue-500 bg-blue-50/30">
                            <p className="text-sm text-slate-700">
                              <strong className="text-blue-700">解析：</strong>{question.explanation}
                            </p>
                          </GlassCard>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        )}

        {/* 邀请码管理标签页 */}
        {activeTab === 'invites' && (
          <div className="space-y-6">
            <GlassCard>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">邀请码管理</h2>
                  <p className="text-slate-600 mt-1">管理用户注册邀请码</p>
                </div>
                <GlassButton
                  onClick={createInviteCode}
                  disabled={loading}
                  variant="primary"
                  size="md"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? '生成中...' : '生成邀请码'}
                </GlassButton>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        邀请码
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        状态
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        创建时间
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        过期时间
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        使用者
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inviteCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="font-mono text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                              {code.code}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${
                            code.is_used
                              ? 'bg-slate-100 text-slate-800'
                              : new Date(code.expires_at) < new Date()
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {code.is_used
                              ? '已使用'
                              : new Date(code.expires_at) < new Date()
                              ? '已过期'
                              : '可用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                          {new Date(code.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                          {new Date(code.expires_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                          {code.used_by_profile?.display_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <GlassButton
                            onClick={() => copyInviteCode(code.code)}
                            variant="glass"
                            size="sm"
                          >
                            {copiedCode === code.code ? (
                              <>
                                <Check className="w-4 h-4" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                复制
                              </>
                            )}
                          </GlassButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}

        {/* 用户管理标签页 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <GlassCard>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">用户管理</h2>
                  <p className="text-slate-600 mt-1">查看和管理系统用户</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* 同步按钮 */}
                  <GlassButton
                    onClick={syncAllUserProgress}
                    disabled={syncLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50"
                  >
                    {syncLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        同步中...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        同步统计
                      </>
                    )}
                  </GlassButton>

                  {/* 修复预测卷按钮 */}
                  <GlassButton
                    onClick={fixPredictionsData}
                    disabled={fixPredictionsLoading}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 disabled:opacity-50"
                  >
                    {fixPredictionsLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        修复中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        修复预测卷
                      </>
                    )}
                  </GlassButton>

                  {/* 搜索框 */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索用户名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 px-4 py-2 pl-10 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                    />
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>

                  {/* 角色过滤 */}
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as 'all' | 'admin' | 'user')}
                    className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  >
                    <option value="all">所有用户</option>
                    <option value="admin">管理员</option>
                    <option value="user">普通用户</option>
                  </select>
                </div>
              </div>

              {/* 用户统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">总用户数</p>
                      <p className="text-2xl font-bold text-blue-700">{users.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">管理员</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {users.filter(u => u.is_admin).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">活跃用户</p>
                      <p className="text-2xl font-bold text-green-700">
                        {users.filter(u => u.user_progress?.[0]?.total_questions > 0).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        用户信息
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        角色
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        注册时间
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        学习统计
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        正确率
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">
                                {user.display_name}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                ID: {user.user_id?.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full ${
                            user.is_admin
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          }`}>
                            {user.is_admin ? '管理员' : '普通用户'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex items-center gap-2 text-slate-600 mb-1">
                              <Activity className="w-4 h-4" />
                              <span className="font-medium">
                                {user.user_progress?.[0]?.total_questions || 0} 题
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              正确: {user.user_progress?.[0]?.correct_answers || 0} |
                              错误: {(user.user_progress?.[0]?.total_questions || 0) - (user.user_progress?.[0]?.correct_answers || 0)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                            user.user_progress?.[0]?.total_questions > 0
                              ? Math.round((user.user_progress[0].correct_answers / user.user_progress[0].total_questions) * 100) >= 80
                                ? 'bg-green-100 text-green-800'
                                : Math.round((user.user_progress[0].correct_answers / user.user_progress[0].total_questions) * 100) >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {user.user_progress?.[0]?.total_questions > 0
                              ? Math.round((user.user_progress[0].correct_answers / user.user_progress[0].total_questions) * 100)
                              : 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <GlassButton
                              onClick={() => editUser(user)}
                              variant="glass"
                              size="sm"
                              disabled={loading}
                            >
                              <Edit className="w-4 h-4" />
                            </GlassButton>

                            <GlassButton
                              onClick={() => updateUserRole(user.user_id, !user.is_admin)}
                              variant={user.is_admin ? "glass" : "primary"}
                              size="sm"
                              disabled={loading || user.user_id === user?.id}
                              title={user.user_id === user?.id ? "不能修改自己的权限" : "切换用户权限"}
                            >
                              {user.is_admin ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </GlassButton>

                            <GlassButton
                              onClick={() => deleteUser(user.user_id, user.display_name)}
                              variant="glass"
                              size="sm"
                              disabled={loading || user.user_id === user?.id}
                              className="text-red-600 hover:bg-red-50"
                              title={user.user_id === user?.id ? "不能删除自己" : "删除用户"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </GlassButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* 用户编辑模态框 */}
            {showUserModal && editingUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <GlassCard className="w-full max-w-md mx-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">编辑用户</h3>
                    <GlassButton
                      onClick={() => setShowUserModal(false)}
                      variant="glass"
                      size="sm"
                    >
                      ✕
                    </GlassButton>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        用户名
                      </label>
                      <input
                        type="text"
                        value={editingUser.display_name || ''}
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          display_name: e.target.value
                        })}
                        className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        用户角色
                      </label>
                      <select
                        value={editingUser.is_admin ? 'admin' : 'user'}
                        onChange={(e) => setEditingUser({
                          ...editingUser,
                          is_admin: e.target.value === 'admin'
                        })}
                        className="w-full px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                      >
                        <option value="user">普通用户</option>
                        <option value="admin">管理员</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <GlassButton
                      onClick={() => setShowUserModal(false)}
                      variant="glass"
                      size="md"
                      className="flex-1"
                    >
                      取消
                    </GlassButton>
                    <GlassButton
                      onClick={saveUserEdit}
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? '保存中...' : '保存'}
                    </GlassButton>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>
        )}
      </GlassContainer>
    </div>
  )
}
