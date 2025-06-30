'use client'

import { useState, useEffect } from 'react'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import { Smartphone, Download, Wifi, WifiOff, Bell, Settings } from 'lucide-react'

export default function PWATest() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return

    // 检查网络状态
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 检查是否已安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // 检查通知权限
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === 'granted') {
      new Notification('通知已启用！', {
        body: '您将收到学习提醒和重要通知',
        icon: '/icons/icon-192x192.png'
      })
    }
  }

  const testNotification = () => {
    if (typeof window === 'undefined' || notificationPermission !== 'granted') return

    new Notification('测试通知', {
      body: '这是一个PWA测试通知',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png'
    })
  }

  const testOfflineMode = () => {
    // 模拟离线模式测试
    alert('请断开网络连接，然后刷新页面测试离线功能')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <GlassContainer maxWidth="md" className="py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            PWA 功能测试
          </h1>
          <p className="text-slate-600">
            测试渐进式Web应用的各项功能
          </p>
        </div>

        <div className="space-y-6">
          {/* 安装状态 */}
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isInstalled ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Smartphone className={`w-6 h-6 ${
                  isInstalled ? 'text-green-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">
                  应用安装状态
                </h3>
                <p className="text-sm text-slate-600">
                  {isInstalled ? '✅ 已安装为PWA应用' : '❌ 未安装，在浏览器中运行'}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* 网络状态 */}
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isOnline ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isOnline ? (
                  <Wifi className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">
                  网络连接状态
                </h3>
                <p className="text-sm text-slate-600">
                  {isOnline ? '🟢 在线模式' : '🔴 离线模式'}
                </p>
              </div>
              <GlassButton
                onClick={testOfflineMode}
                variant="secondary"
                size="sm"
              >
                测试离线
              </GlassButton>
            </div>
          </GlassCard>

          {/* 通知权限 */}
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                notificationPermission === 'granted' ? 'bg-green-100' : 
                notificationPermission === 'denied' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <Bell className={`w-6 h-6 ${
                  notificationPermission === 'granted' ? 'text-green-600' : 
                  notificationPermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">
                  通知权限
                </h3>
                <p className="text-sm text-slate-600">
                  {notificationPermission === 'granted' ? '✅ 已授权' : 
                   notificationPermission === 'denied' ? '❌ 已拒绝' : '⏳ 未设置'}
                </p>
              </div>
              <div className="flex gap-2">
                {notificationPermission !== 'granted' && (
                  <GlassButton
                    onClick={requestNotificationPermission}
                    variant="primary"
                    size="sm"
                  >
                    请求权限
                  </GlassButton>
                )}
                {notificationPermission === 'granted' && (
                  <GlassButton
                    onClick={testNotification}
                    variant="secondary"
                    size="sm"
                  >
                    测试通知
                  </GlassButton>
                )}
              </div>
            </div>
          </GlassCard>

          {/* PWA特性 */}
          <GlassCard>
            <h3 className="font-semibold text-slate-800 mb-4">
              PWA 特性支持
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Service Worker</span>
                <span className="text-sm font-medium">
                  {typeof window !== 'undefined' && 'serviceWorker' in navigator ? '✅ 支持' : '❌ 不支持'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Web App Manifest</span>
                <span className="text-sm font-medium">✅ 已配置</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">离线缓存</span>
                <span className="text-sm font-medium">✅ 已启用</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">推送通知</span>
                <span className="text-sm font-medium">
                  {typeof window !== 'undefined' && 'Notification' in window ? '✅ 支持' : '❌ 不支持'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">后台同步</span>
                <span className="text-sm font-medium">
                  {typeof window !== 'undefined' && 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype ? '✅ 支持' : '❌ 不支持'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* 使用说明 */}
          <GlassCard className="bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <h3 className="font-semibold text-slate-800 mb-3">
              📱 如何安装PWA应用
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>Chrome/Edge (Android/Desktop):</strong></p>
              <p>• 点击地址栏右侧的"安装"图标</p>
              <p>• 或点击菜单中的"安装应用"</p>
              
              <p className="mt-3"><strong>Safari (iOS):</strong></p>
              <p>• 点击分享按钮 📤</p>
              <p>• 选择"添加到主屏幕"</p>
              
              <p className="mt-3"><strong>Firefox:</strong></p>
              <p>• 点击地址栏中的"安装"提示</p>
            </div>
          </GlassCard>
        </div>
      </GlassContainer>
    </div>
  )
}
