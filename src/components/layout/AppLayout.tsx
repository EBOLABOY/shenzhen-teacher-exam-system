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

  // 检查是否为练习页面（需要固定高度布局）
  const isPracticePage = pathname === '/practice'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {shouldShowNav && <TopNavigation />}
      <main className={
        shouldShowNav
          ? isPracticePage
            ? '' // 练习页面不添加内边距，使用固定高度布局
            : 'pt-16 pb-20 md:pb-0' // 其他页面使用正常内边距
          : ''
      }>
        {children}
      </main>
      {shouldShowNav && !isPracticePage && <BottomNavigation />}
    </div>
  )
}
