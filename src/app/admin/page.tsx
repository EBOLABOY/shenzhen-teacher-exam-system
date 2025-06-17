'use client'

import { useState, useEffect } from 'react'
import { Upload, Database, FileText, BarChart3, Key, Users, Plus, Copy, Check, Sparkles, Settings } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui/GlassCard.tsx'
import ImportTool from './import-tool'

export default function AdminPage() {
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState<any>(null)
  const [inviteCodes, setInviteCodes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')



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
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_progress(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('获取用户列表失败:', error)
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

  // 页面加载时获取数据
  useEffect(() => {
    fetchStats()
    fetchInviteCodes()
    fetchUsers()
  }, [])

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
          <GlassCard>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">用户管理</h2>
              <p className="text-slate-600 mt-1">查看和管理系统用户</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                      用户名
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                      角色
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                      注册时间
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                      答题统计
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">
                      正确率
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-800">
                          {user.display_name}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                        {user.user_progress?.[0]?.total_questions || 0} 题
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
      </GlassContainer>
    </div>
  )
}
