'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface FireworksAnimationProps {
  isVisible: boolean
  onComplete?: () => void
  duration?: number
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  maxLife: number
}

export default function FireworksAnimation({ 
  isVisible, 
  onComplete, 
  duration = 3000 
}: FireworksAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setParticles([])
      setShowMessage(false)
      return
    }

    // 显示祝贺消息
    setShowMessage(true)

    // 创建多个烟花爆炸
    const createFirework = (centerX: number, centerY: number, delay: number = 0) => {
      setTimeout(() => {
        const newParticles: Particle[] = []
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']
        
        // 创建爆炸粒子
        for (let i = 0; i < 30; i++) {
          const angle = (Math.PI * 2 * i) / 30
          const velocity = 2 + Math.random() * 3
          
          newParticles.push({
            id: Date.now() + i + delay,
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 3 + Math.random() * 4,
            life: 60,
            maxLife: 60
          })
        }
        
        setParticles(prev => [...prev, ...newParticles])
      }, delay)
    }

    // 创建多个烟花，在不同位置和时间爆炸
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // 主烟花在中心
    createFirework(centerX, centerY, 0)
    // 左上角烟花
    createFirework(centerX - 150, centerY - 100, 400)
    // 右上角烟花
    createFirework(centerX + 150, centerY - 100, 800)
    // 左下角烟花
    createFirework(centerX - 100, centerY + 80, 1200)
    // 右下角烟花
    createFirework(centerX + 100, centerY + 80, 1600)

    // 动画循环
    const animationInterval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // 重力效果
          life: particle.life - 1,
          size: particle.size * 0.98 // 粒子逐渐变小
        })).filter(particle => particle.life > 0)
      )
    }, 16) // 60fps

    // 自动完成
    const completeTimer = setTimeout(() => {
      setShowMessage(false)
      setParticles([])
      onComplete?.()
    }, duration)

    return () => {
      clearInterval(animationInterval)
      clearTimeout(completeTimer)
    }
  }, [isVisible, duration, onComplete])

  if (!isVisible) return null

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* 烟花粒子 */}
      <svg className="absolute inset-0 w-full h-full">
        {particles.map(particle => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill={particle.color}
            opacity={particle.life / particle.maxLife}
            style={{
              filter: 'drop-shadow(0 0 6px currentColor)',
            }}
          />
        ))}
      </svg>

      {/* 祝贺消息 */}
      {showMessage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gradient-to-br from-white/95 to-purple-50/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-200/30 p-8 text-center animate-pulse">
            <div className="text-8xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 mb-4 animate-pulse">
              恭喜掌握！
            </h2>
            <p className="text-xl text-slate-700 font-semibold mb-4">
              错题已从错题本中移除
            </p>
            <div className="flex justify-center space-x-3 mb-4">
              <span className="text-3xl animate-spin">⭐</span>
              <span className="text-3xl animate-pulse delay-100">✨</span>
              <span className="text-3xl animate-bounce delay-200">🌟</span>
              <span className="text-3xl animate-pulse delay-300">✨</span>
              <span className="text-3xl animate-spin delay-500">⭐</span>
            </div>
            <div className="text-sm text-purple-600 font-medium animate-pulse">
              继续加油，你做得很棒！
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
