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
  duration = 1500
}: FireworksAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setParticles([])
      setShowMessage(false)
      return
    }

    // 立即显示祝贺消息
    setShowMessage(true)

    // 创建简化的烟花爆炸
    const createFirework = (centerX: number, centerY: number, delay: number = 0) => {
      setTimeout(() => {
        const newParticles: Particle[] = []
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

        // 减少粒子数量，提高性能
        for (let i = 0; i < 15; i++) {
          const angle = (Math.PI * 2 * i) / 15
          const velocity = 3 + Math.random() * 2

          newParticles.push({
            id: Date.now() + i + delay,
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 3,
            life: 30, // 减少生命周期
            maxLife: 30
          })
        }

        setParticles(prev => [...prev, ...newParticles])
      }, delay)
    }

    // 只创建2个烟花，快速连续爆炸
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // 主烟花立即爆炸
    createFirework(centerX, centerY, 0)
    // 第二个烟花稍微延迟
    createFirework(centerX, centerY - 50, 200)

    // 优化的动画循环
    const animationInterval = setInterval(() => {
      setParticles(prev =>
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.15, // 稍微增加重力，让粒子更快落下
          life: particle.life - 2, // 加快粒子消失速度
          size: particle.size * 0.95 // 粒子更快变小
        })).filter(particle => particle.life > 0)
      )
    }, 20) // 稍微降低帧率以提高性能

    // 快速完成
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

      {/* 简化的祝贺消息 */}
      {showMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-green-200/50 px-6 py-4 text-center animate-pulse">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-1">
              答对了！
            </h2>
            <p className="text-sm text-slate-600">
              错题已掌握
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
