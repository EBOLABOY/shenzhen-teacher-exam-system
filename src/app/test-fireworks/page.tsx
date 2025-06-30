'use client'

import { useState } from 'react'
import FireworksAnimation from '@/components/ui/FireworksAnimation'
import { GlassButton, GlassCard, GlassContainer } from '@/components/ui'

export default function TestFireworks() {
  const [showFireworks, setShowFireworks] = useState(false)

  const triggerFireworks = () => {
    setShowFireworks(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <GlassContainer maxWidth="md" className="py-20">
        <GlassCard className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-6">
            烟花动画测试
          </h1>
          <p className="text-slate-600 mb-8">
            点击按钮测试错题掌握时的烟花动画效果
          </p>
          <GlassButton
            onClick={triggerFireworks}
            variant="primary"
            size="lg"
            disabled={showFireworks}
          >
            {showFireworks ? '烟花进行中...' : '🎉 触发烟花'}
          </GlassButton>
        </GlassCard>
      </GlassContainer>

      <FireworksAnimation
        isVisible={showFireworks}
        onComplete={() => setShowFireworks(false)}
        duration={3000}
      />
    </div>
  )
}
