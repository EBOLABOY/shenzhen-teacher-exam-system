'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Home,
  BookOpen,
  Target,
  Brain,
  BarChart3,
  FileText
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

export const navigationItems: NavigationItem[] = [
  {
    name: '首页',
    href: '/',
    icon: Home,
    description: '返回主页'
  },
  {
    name: '练习',
    href: '/practice',
    icon: BookOpen,
    description: '开始刷题练习'
  },
  {
    name: '试卷中心',
    href: '/exams',
    icon: FileText,
    description: '历年真题和预测卷练习'
  },
  {
    name: '错题本',
    href: '/wrong-questions',
    icon: Target,
    description: '查看和分析错题'
  },
  {
    name: '任务',
    href: '/tasks',
    icon: BarChart3,
    description: '管理练习任务'
  },
  {
    name: 'AI分析',
    href: '/ai-analysis',
    icon: Brain,
    description: '查看AI分析结果'
  }
]

export function useTopNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // 检查用户登录状态
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setIsMenuOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const navigateTo = (href: string) => {
    router.push(href)
    setIsMenuOpen(false)
  }

  return {
    user,
    isMenuOpen,
    setIsMenuOpen,
    handleLogout,
    isActive,
    navigateTo,
    router
  }
}
