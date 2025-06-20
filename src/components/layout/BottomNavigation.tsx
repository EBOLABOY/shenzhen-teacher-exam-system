'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import {
  Home,
  BookOpen,
  Target,
  BarChart3,
  Brain,
  FileText
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const bottomNavItems: NavigationItem[] = [
  {
    name: '首页',
    href: '/',
    icon: Home
  },
  {
    name: '练习',
    href: '/practice',
    icon: BookOpen
  },
  {
    name: '试卷',
    href: '/exams',
    icon: FileText
  },
  {
    name: '错题',
    href: '/wrong-questions',
    icon: Target
  },
  {
    name: 'AI',
    href: '/ai-analysis',
    icon: Brain
  }
]

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
  
  const [user, setUser] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)

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

  useEffect(() => {
    // 检查是否为移动端
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  // 不需要显示底部导航的页面
  const noBottomNavPages = ['/login', '/register', '/forgot-password', '/reset-password']
  const shouldShow = user && isMobile && !noBottomNavPages.some(page => pathname.startsWith(page))

  if (!shouldShow) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-white/20 shadow-lg">
      <div className="flex items-center justify-around py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? 'text-blue-600'
                  : 'text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-600'}`} />
              <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-slate-600'}`}>
                {item.name}
              </span>
              {active && (
                <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
      
      {/* 底部安全区域 */}
      <div className="h-safe-area-inset-bottom"></div>
    </div>
  )
}
