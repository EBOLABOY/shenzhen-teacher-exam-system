'use client'

import { useIsMobile } from '@/hooks/useMediaQuery'
import { useTopNavigation, navigationItems } from '@/hooks/useTopNavigation'
import MobileNavigation from './MobileNavigation'
import DesktopNavigation from './DesktopNavigation'

export default function TopNavigation() {
  const isMobile = useIsMobile()
  const {
    user,
    isMenuOpen,
    setIsMenuOpen,
    handleLogout,
    isActive,
    navigateTo
  } = useTopNavigation()

  // 如果用户未登录，不显示导航栏
  if (!user) {
    return null
  }

  // 根据设备类型渲染对应的导航组件
  if (isMobile) {
    return (
      <MobileNavigation
        user={user}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        navigationItems={navigationItems}
        isActive={isActive}
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
    )
  }

  return (
    <DesktopNavigation
      user={user}
      navigationItems={navigationItems}
      isActive={isActive}
      navigateTo={navigateTo}
      handleLogout={handleLogout}
    />
  )
}

