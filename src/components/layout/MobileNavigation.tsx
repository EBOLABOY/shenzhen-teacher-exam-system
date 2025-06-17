'use client'

import { User, Menu, X, LogOut, Settings, Sparkles } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassCard'
import { NavigationItem } from '@/hooks/useTopNavigation'

interface MobileNavigationProps {
  user: any
  isMenuOpen: boolean
  setIsMenuOpen: (open: boolean) => void
  navigationItems: NavigationItem[]
  isActive: (href: string) => boolean
  navigateTo: (href: string) => void
  handleLogout: () => void
}

export default function MobileNavigation({
  user,
  isMenuOpen,
  setIsMenuOpen,
  navigationItems,
  isActive,
  navigateTo,
  handleLogout
}: MobileNavigationProps) {
  return (
    <div>
      {/* 移动端顶部栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">教师考编</span>
          </div>

          <GlassButton
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant="glass"
            size="sm"
            className="p-2"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </GlassButton>
        </div>
      </div>

      {/* 移动端侧边菜单 */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-white/90 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* 用户信息 */}
            <div className="flex items-center gap-3 mb-8 mt-16">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800">用户</p>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>
            </div>

            {/* 导航菜单 */}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <button
                    key={item.name}
                    onClick={() => navigateTo(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className={`text-xs ${active ? 'text-blue-100' : 'text-slate-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* 底部操作 */}
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <button
                onClick={() => navigateTo('/settings')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-all duration-200"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">设置</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端内容间距 */}
      <div className="h-16"></div>
    </div>
  )
}
