'use client'

import { usePathname } from 'next/navigation'
import TopNavigation from './TopNavigation'
import BottomNavigation from './BottomNavigation'

interface AppLayoutProps {
  children: React.ReactNode
}

// 不需要显示导航栏的页面
const noNavPages = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/auth/confirm',
  '/auth/reset-password'
]

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  
  // 检查当前页面是否需要显示导航栏
  const shouldShowNav = !noNavPages.some(page => pathname.startsWith(page))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {shouldShowNav && <TopNavigation />}
      <main className={shouldShowNav ? 'pt-16 pb-20 md:pb-0' : ''}>
        {children}
      </main>
      {shouldShowNav && <BottomNavigation />}
    </div>
  )
}
