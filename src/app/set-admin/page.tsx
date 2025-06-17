'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SetAdminPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const setCurrentUserAsAdmin = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResult('用户未登录')
        return
      }

      // 检查是否已有用户配置
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {
        // 更新现有配置
        const { data, error } = await supabase
          .from('user_profiles')
          .update({ is_admin: true })
          .eq('user_id', user.id)
          .select()

        if (error) {
          setResult(`更新管理员权限失败: ${error.message}`)
        } else {
          setResult(`成功设置管理员权限: ${JSON.stringify(data, null, 2)}`)
        }
      } else {
        // 创建新的用户配置
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            display_name: user.email,
            is_admin: true
          })
          .select()

        if (error) {
          setResult(`创建管理员配置失败: ${error.message}`)
        } else {
          setResult(`成功创建管理员配置: ${JSON.stringify(data, null, 2)}`)
        }
      }
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentUser = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResult('用户未登录')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setResult(`当前用户信息:
用户ID: ${user.id}
邮箱: ${user.email}
配置: ${JSON.stringify(profile, null, 2)}`)
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">设置管理员权限</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={checkCurrentUser}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            检查当前用户
          </button>
          
          <button
            onClick={setCurrentUserAsAdmin}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            设置为管理员
          </button>
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-bold mb-2">结果:</h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
