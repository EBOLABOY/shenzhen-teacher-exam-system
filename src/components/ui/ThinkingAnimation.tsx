'use client'

import { useState, useEffect } from 'react'
import { Brain, Sparkles, Zap } from 'lucide-react'

interface ThinkingAnimationProps {
  isVisible: boolean
  onCancel?: () => void
}

export default function ThinkingAnimation({ isVisible, onCancel }: ThinkingAnimationProps) {
  const [seconds, setSeconds] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(0)

  const phases = [
    { text: '正在思考中', icon: Brain, color: 'from-blue-500 to-blue-600' },
    { text: '深度分析中', icon: Sparkles, color: 'from-purple-500 to-purple-600' },
    { text: '整理结果中', icon: Zap, color: 'from-green-500 to-green-600' }
  ]

  useEffect(() => {
    if (!isVisible) {
      setSeconds(0)
      setCurrentPhase(0)
      return
    }

    const timer = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)

    const phaseTimer = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % phases.length)
    }, 3000)

    return () => {
      clearInterval(timer)
      clearInterval(phaseTimer)
    }
  }, [isVisible, phases.length])

  if (!isVisible) return null

  const CurrentIcon = phases[currentPhase].icon

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20">
        {/* 动画图标 */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 bg-gradient-to-r ${phases[currentPhase].color} rounded-2xl flex items-center justify-center animate-pulse`}>
            <CurrentIcon className="w-10 h-10 text-white animate-bounce" />
          </div>
        </div>

        {/* 状态文本 */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            AI私教分析
          </h3>
          <p className="text-lg text-slate-600 mb-4 transition-all duration-500">
            {phases[currentPhase].text}...
          </p>
          
          {/* 计时器 */}
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="font-mono text-lg">
              {Math.floor(seconds / 60).toString().padStart(2, '0')}:
              {(seconds % 60).toString().padStart(2, '0')}
            </span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 animate-pulse"
              style={{ width: `${((currentPhase + 1) / phases.length) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>开始分析</span>
            <span>完成分析</span>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="text-center text-sm text-slate-500 mb-6">
          <p>思考模型正在深度分析您的错题...</p>
          <p className="mt-1">这可能需要几分钟时间，请耐心等待</p>
        </div>

        {/* 取消按钮 */}
        {onCancel && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              取消分析
            </button>
          </div>
        )}

        {/* 装饰性动画点 */}
        <div className="absolute top-4 right-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}
