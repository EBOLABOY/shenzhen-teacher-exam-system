'use client'

import { useState, useEffect } from 'react'

/**
 * 自定义 Hook 用于响应式媒体查询
 * @param query - CSS 媒体查询字符串
 * @returns boolean - 是否匹配查询条件
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * 检查是否为移动端设备
 * @returns boolean - 是否为移动端
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
