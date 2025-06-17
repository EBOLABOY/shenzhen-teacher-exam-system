'use client'

import { LogOut, Settings, Sparkles } from 'lucide-react'
import { NavigationItem } from '@/hooks/useTopNavigation'

interface DesktopNavigationProps {
  user: any
  navigationItems: NavigationItem[]
  isActive: (href: string) => boolean
  navigateTo: (href: string) => void
  handleLogout: () => void
}

export default function DesktopNavigation({
  user,
  navigationItems,
  isActive,
  navigateTo,
  handleLogout
}: DesktopNavigationProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-xl">深圳教师考编刷题系统</span>
          </div>

          {/* 导航菜单 */}
          <nav className="flex items-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <button
                  key={item.name}
                  onClick={() => navigateTo(item.href)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                </button>
              )
            })}
          </nav>

          {/* 用户菜单 */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">用户</p>
              <p className="text-xs text-slate-600">{user.email}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('/settings')}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 hover:bg-white/70 transition-all duration-200"
                title="设置"
              >
                <Settings className="w-4 h-4 text-slate-600" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/50 hover:bg-red-50 transition-all duration-200 text-red-600 hover:text-red-700"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
