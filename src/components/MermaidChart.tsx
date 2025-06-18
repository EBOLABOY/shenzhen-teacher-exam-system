'use client'

import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidChartProps {
  chart: string
  className?: string
}

export default function MermaidChart({ chart, className = '' }: MermaidChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    // 初始化Mermaid（如果还没有初始化）
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#60a5fa',
        lineColor: '#6b7280',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#ffffff'
      }
    })

    const renderChart = async () => {
      if (!chartRef.current || !chart.trim()) return

      try {
        // 清空容器
        chartRef.current.innerHTML = ''
        
        // 渲染Mermaid图表
        const { svg } = await mermaid.render(chartId.current, chart)
        
        if (chartRef.current) {
          chartRef.current.innerHTML = svg
          
          // 添加一些样式优化
          const svgElement = chartRef.current.querySelector('svg')
          if (svgElement) {
            svgElement.style.maxWidth = '100%'
            svgElement.style.height = 'auto'
          }
        }
      } catch (error) {
        console.error('Mermaid渲染失败:', error)
        
        // 降级到文本显示
        if (chartRef.current) {
          chartRef.current.innerHTML = `
            <div class="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-yellow-700 mb-2">图表渲染失败，显示文本版本：</p>
              <pre class="text-sm text-gray-600 whitespace-pre-wrap text-left">${chart}</pre>
            </div>
          `
        }
      }
    }

    // 延迟渲染以确保DOM完全加载
    const timer = setTimeout(renderChart, 100)
    
    return () => clearTimeout(timer)
  }, [chart])

  return (
    <div className={`my-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 ${className}`}>
      <div 
        ref={chartRef}
        className="flex justify-center min-h-[200px] items-center"
      >
        <div className="text-gray-500 animate-pulse">正在渲染图表...</div>
      </div>
    </div>
  )
}
