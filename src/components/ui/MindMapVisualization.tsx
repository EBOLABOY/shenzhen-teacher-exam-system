'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard.tsx'
import { ChevronRight, ChevronDown, Brain, Lightbulb, Target } from 'lucide-react'

interface AIAnalysisResult {
  analysis_summary: string
  weakness_diagnostic: {
    subject: string
    chapter: string
    knowledge_points: string[]
  }
  targeted_tutoring_sessions: Array<{
    knowledge_point: string
    core_concept_explanation: string
    wrong_question_analysis: {
      question_stem: string
      user_answer: string
      correct_answer: string
      analysis: string
    }
    illustrative_examples: string[]
    knowledge_mind_map: {
      title: string
      map: string[]
    }
  }>
  motivational_message: string
}

interface MindMapVisualizationProps {
  data: AIAnalysisResult
}

interface MindMapNode {
  id: string
  text: string
  level: number
  children: MindMapNode[]
  isExpanded: boolean
}

export default function MindMapVisualization({ data }: MindMapVisualizationProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']))

  // 解析思维导图数据
  const parseMindMapData = (): MindMapNode => {
    const rootNode: MindMapNode = {
      id: 'root',
      text: `${data.weakness_diagnostic.subject} - 知识点分析`,
      level: 0,
      children: [],
      isExpanded: true
    }

    // 添加薄弱点诊断
    const weaknessNode: MindMapNode = {
      id: 'weakness',
      text: '薄弱点诊断',
      level: 1,
      children: [
        {
          id: 'subject',
          text: `科目: ${data.weakness_diagnostic.subject}`,
          level: 2,
          children: [],
          isExpanded: false
        },
        {
          id: 'chapter',
          text: `章节: ${data.weakness_diagnostic.chapter}`,
          level: 2,
          children: [],
          isExpanded: false
        },
        {
          id: 'knowledge-points',
          text: '具体知识点',
          level: 2,
          children: data.weakness_diagnostic.knowledge_points.map((point, index) => ({
            id: `kp-${index}`,
            text: point,
            level: 3,
            children: [],
            isExpanded: false
          })),
          isExpanded: false
        }
      ],
      isExpanded: false
    }

    // 添加教学课堂
    const tutoringSessions: MindMapNode = {
      id: 'tutoring',
      text: '靶向教学课堂',
      level: 1,
      children: data.targeted_tutoring_sessions.map((session, index) => ({
        id: `session-${index}`,
        text: session.knowledge_point,
        level: 2,
        children: [
          {
            id: `concept-${index}`,
            text: '核心概念',
            level: 3,
            children: [],
            isExpanded: false
          },
          {
            id: `analysis-${index}`,
            text: '错题分析',
            level: 3,
            children: [],
            isExpanded: false
          },
          {
            id: `examples-${index}`,
            text: '情境举例',
            level: 3,
            children: [],
            isExpanded: false
          },
          {
            id: `mindmap-${index}`,
            text: session.knowledge_mind_map.title,
            level: 3,
            children: session.knowledge_mind_map.map.map((item, mapIndex) => ({
              id: `map-${index}-${mapIndex}`,
              text: item.trim(),
              level: 4,
              children: [],
              isExpanded: false
            })),
            isExpanded: false
          }
        ],
        isExpanded: false
      })),
      isExpanded: false
    }

    rootNode.children = [weaknessNode, tutoringSessions]
    return rootNode
  }

  const mindMapData = parseMindMapData()

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getNodeIcon = (level: number, hasChildren: boolean) => {
    if (level === 0) return <Brain className="w-5 h-5 text-purple-600" />
    if (level === 1) return <Target className="w-4 h-4 text-blue-600" />
    if (level === 2) return <Lightbulb className="w-4 h-4 text-green-600" />
    return hasChildren ? <ChevronRight className="w-3 h-3 text-slate-500" /> : null
  }

  const getNodeColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      case 1: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 2: return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      case 3: return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
    }
  }

  const renderNode = (node: MindMapNode): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const indent = node.level * 24

    return (
      <div key={node.id} className="mb-2">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-all duration-200"
          style={{ marginLeft: `${indent}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-600" />
              )}
            </div>
          )}
          
          <div className="flex-shrink-0">
            {getNodeIcon(node.level, hasChildren)}
          </div>
          
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${getNodeColor(node.level)}`}>
            {node.text}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    )
  }

  // SVG思维导图渲染
  const renderSVGMindMap = () => {
    const width = 1200
    const height = 800
    const centerX = width / 2
    const centerY = height / 2

    // 计算节点位置
    const calculateNodePositions = (node: MindMapNode, x: number, y: number, angle: number, radius: number): Array<{node: MindMapNode, x: number, y: number}> => {
      const positions = [{ node, x, y }]
      
      if (node.children.length > 0) {
        const angleStep = (Math.PI * 2) / Math.max(node.children.length, 1)
        node.children.forEach((child, index) => {
          const childAngle = angle + (index - (node.children.length - 1) / 2) * angleStep
          const childX = x + Math.cos(childAngle) * radius
          const childY = y + Math.sin(childAngle) * radius
          positions.push(...calculateNodePositions(child, childX, childY, childAngle, radius * 0.7))
        })
      }
      
      return positions
    }

    const nodePositions = calculateNodePositions(mindMapData, centerX, centerY, 0, 200)

    return (
      <div className="w-full overflow-auto">
        <svg width={width} height={height} className="border border-slate-200 rounded-lg bg-white">
          {/* 连接线 */}
          {nodePositions.map(({ node, x, y }) => 
            node.children.map((child, index) => {
              const childPos = nodePositions.find(pos => pos.node.id === child.id)
              if (!childPos) return null
              
              return (
                <line
                  key={`${node.id}-${child.id}`}
                  x1={x}
                  y1={y}
                  x2={childPos.x}
                  y2={childPos.y}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )
            })
          )}
          
          {/* 节点 */}
          {nodePositions.map(({ node, x, y }) => (
            <g key={node.id}>
              <circle
                cx={x}
                cy={y}
                r={Math.max(40 - node.level * 8, 20)}
                fill={node.level === 0 ? '#8b5cf6' : node.level === 1 ? '#3b82f6' : node.level === 2 ? '#10b981' : '#f59e0b'}
                opacity="0.8"
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={Math.max(12 - node.level, 8)}
                fontWeight="bold"
              >
                {node.text.length > 10 ? node.text.substring(0, 10) + '...' : node.text}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  }

  const [viewMode, setViewMode] = useState<'tree' | 'svg'>('tree')

  return (
    <div className="space-y-6">
      {/* 视图切换 */}
      <GlassCard variant="light">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'tree' 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            树形结构
          </button>
          <button
            onClick={() => setViewMode('svg')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'svg' 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            SVG导图
          </button>
        </div>
      </GlassCard>

      {/* 思维导图内容 */}
      <GlassCard>
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          知识点思维导图
        </h3>
        
        {viewMode === 'tree' ? (
          <div className="space-y-2">
            {renderNode(mindMapData)}
          </div>
        ) : (
          renderSVGMindMap()
        )}
      </GlassCard>

      {/* 操作提示 */}
      <GlassCard variant="light" className="text-center">
        <p className="text-slate-600">
          {viewMode === 'tree' 
            ? '点击节点可以展开/收起子节点，查看详细的知识结构' 
            : 'SVG思维导图展示了知识点之间的关联关系，可以滚动查看完整内容'
          }
        </p>
      </GlassCard>
    </div>
  )
}
