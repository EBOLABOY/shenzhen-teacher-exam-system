/**
 * AI分析服务
 * 集成OpenAI格式的API调用，支持思考模型
 */

import { 
  AI_CONFIG, 
  AI_SYSTEM_PROMPT, 
  AI_USER_PROMPT_TEMPLATE,
  SUBJECT_MAPPING,
  DIFFICULTY_MAPPING,
  QUESTION_TYPE_MAPPING
} from '@/config/ai-prompts'

interface WrongQuestionData {
  id: number
  question_id: number
  user_answer: string
  correct_answer: string
  question_type: string
  subject: string
  difficulty: string
  wrong_count: number
  questions: {
    question: string
    options: Record<string, string>
    explanation?: string
  }
}

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

export class AIAnalysisService {
  private baseURL: string
  private apiKey: string
  private model: string
  private timeout: number

  constructor() {
    this.baseURL = AI_CONFIG.baseURL
    this.apiKey = AI_CONFIG.apiKey
    this.model = AI_CONFIG.model
    this.timeout = AI_CONFIG.timeout
  }

  /**
   * 分析错题数据
   */
  async analyzeWrongQuestions(wrongQuestions: WrongQuestionData[]): Promise<AIAnalysisResult> {
    if (!wrongQuestions || wrongQuestions.length === 0) {
      throw new Error('没有错题数据可供分析')
    }

    // 构建分析数据
    const analysisData = this.buildAnalysisData(wrongQuestions)
    
    // 生成用户提示词
    const userPrompt = this.generateUserPrompt(analysisData)
    
    console.log('🤖 开始AI分析，错题数量:', wrongQuestions.length)
    console.log('📝 用户提示词长度:', userPrompt.length)

    try {
      // 调用AI API
      const response = await this.callAIAPI(userPrompt)
      
      // 解析响应
      const analysisResult = this.parseAIResponse(response)
      
      console.log('✅ AI分析完成')
      return analysisResult

    } catch (error) {
      console.error('❌ AI分析失败:', error)
      throw new Error(`AI分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 构建分析数据
   */
  private buildAnalysisData(wrongQuestions: WrongQuestionData[]) {
    const subjectStats: Record<string, any> = {}
    const difficultyStats: Record<string, number> = {}
    const questionTypeStats: Record<string, number> = {}
    const wrongQuestionsDetails: string[] = []

    wrongQuestions.forEach((wq, index) => {
      // 安全检查
      if (!wq || !wq.questions) {
        console.warn(`错题数据不完整，跳过索引 ${index}`)
        return
      }

      const subject = wq.subject || '未知科目'
      const difficulty = wq.difficulty || '未知难度'
      const questionType = wq.question_type || 'unknown'

      // 科目统计
      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          count: 0,
          totalWrongCount: 0,
          questions: []
        }
      }
      subjectStats[subject].count++
      subjectStats[subject].totalWrongCount += wq.wrong_count
      subjectStats[subject].questions.push({
        question: wq.questions?.question || '题目内容缺失',
        userAnswer: wq.user_answer || '未知',
        correctAnswer: wq.correct_answer || '未知',
        wrongCount: wq.wrong_count || 1
      })

      // 难度统计
      if (difficulty) {
        difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1
      }

      // 题型统计
      questionTypeStats[questionType] = (questionTypeStats[questionType] || 0) + 1

      // 详细错题信息
      let optionsText = '选项信息缺失'
      try {
        if (wq.questions?.options && typeof wq.questions.options === 'object') {
          const entries = Object.entries(wq.questions.options)
          if (entries.length > 0) {
            optionsText = entries
              .map(([key, value]) => `${key}. ${value}`)
              .join('\n')
          }
        }
      } catch (error) {
        console.error('处理选项时出错:', error, '选项数据:', wq.questions?.options)
        optionsText = '选项处理失败'
      }

      wrongQuestionsDetails.push(`
### 错题 ${index + 1}
**科目**: ${subject}
**题型**: ${QUESTION_TYPE_MAPPING[questionType as keyof typeof QUESTION_TYPE_MAPPING]?.name || questionType}
**难度**: ${DIFFICULTY_MAPPING[difficulty as keyof typeof DIFFICULTY_MAPPING]?.name || difficulty}
**错误次数**: ${wq.wrong_count || 1}

**题目**: ${wq.questions?.question || '题目内容缺失'}

**选项**:
${optionsText}

**您的答案**: ${wq.user_answer || '未知'}
**正确答案**: ${wq.correct_answer || '未知'}
${wq.questions?.explanation ? `**解析**: ${wq.questions.explanation}` : ''}
`)
    })

    return {
      totalWrongQuestions: wrongQuestions.length,
      subjects: Object.keys(subjectStats),
      questionTypes: Object.keys(questionTypeStats),
      difficulties: Object.keys(difficultyStats),
      subjectStats,
      difficultyStats,
      questionTypeStats,
      wrongQuestionsDetails
    }
  }

  /**
   * 生成用户提示词
   */
  private generateUserPrompt(analysisData: any): string {
    const {
      totalWrongQuestions,
      subjects,
      questionTypes,
      difficulties,
      subjectStats,
      difficultyStats,
      questionTypeStats,
      wrongQuestionsDetails
    } = analysisData

    // 构建科目统计文本
    const subjectStatsText = subjectStats && typeof subjectStats === 'object'
      ? Object.entries(subjectStats)
          .map(([subject, stats]: [string, any]) => {
            const avgWrongCount = (stats.totalWrongCount / stats.count).toFixed(1)
            const subjectInfo = SUBJECT_MAPPING[subject as keyof typeof SUBJECT_MAPPING]
            return `
**${subject}** (${subjectInfo?.description || ''}):
- 错题数量: ${stats.count}
- 平均错误次数: ${avgWrongCount}
- 主要知识点: ${subjectInfo?.keyTopics.join('、') || '未知'}
- 错误题目占比: ${((stats.count / totalWrongQuestions) * 100).toFixed(1)}%`
          })
          .join('\n')
      : '科目统计信息缺失'

    // 构建题型分布文本
    const questionTypesText = questionTypeStats && typeof questionTypeStats === 'object'
      ? Object.entries(questionTypeStats)
          .map(([type, count]) => {
            const typeInfo = QUESTION_TYPE_MAPPING[type as keyof typeof QUESTION_TYPE_MAPPING]
            return `${typeInfo?.name || type}: ${count}道`
          })
          .join('、')
      : '题型统计信息缺失'

    // 构建难度分布文本
    const difficultiesText = difficultyStats && typeof difficultyStats === 'object'
      ? Object.entries(difficultyStats)
          .map(([difficulty, count]) => {
            const diffInfo = DIFFICULTY_MAPPING[difficulty as keyof typeof DIFFICULTY_MAPPING]
            return `${diffInfo?.name || difficulty}: ${count}道`
          })
          .join('、')
      : '难度统计信息缺失'

    return AI_USER_PROMPT_TEMPLATE
      .replace('{totalWrongQuestions}', totalWrongQuestions.toString())
      .replace('{subjects}', subjects.join('、'))
      .replace('{questionTypes}', questionTypesText)
      .replace('{difficulties}', difficultiesText)
      .replace('{wrongQuestionsDetails}', wrongQuestionsDetails.join('\n'))
      .replace('{subjectStats}', subjectStatsText)
  }

  /**
   * 调用AI API
   */
  private async callAIAPI(userPrompt: string): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      console.log('🔄 正在调用AI API...')
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: AI_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          stream: false
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API调用失败: ${response.status} ${response.statusText}\n${errorText}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API响应格式异常')
      }

      return data.choices[0].message.content

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI分析超时，请稍后重试')
      }
      
      throw error
    }
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): AIAnalysisResult {
    console.log('🔍 开始解析AI响应，响应长度:', response.length)
    console.log('🔍 响应前200字符:', response.substring(0, 200))

    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                       response.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        console.log('🔍 提取的JSON字符串长度:', jsonStr.length)
        console.log('🔍 JSON前200字符:', jsonStr.substring(0, 200))

        const parsed = JSON.parse(jsonStr)
        console.log('🔍 JSON解析成功，字段检查:')
        console.log('  - analysis_summary:', !!parsed.analysis_summary)
        console.log('  - weakness_diagnostic:', !!parsed.weakness_diagnostic)
        console.log('  - targeted_tutoring_sessions:', !!parsed.targeted_tutoring_sessions)
        console.log('  - motivational_message:', !!parsed.motivational_message)

        // 验证必要字段 - 更新为与系统提示词一致的字段
        if (!parsed.analysis_summary || !parsed.weakness_diagnostic || !parsed.targeted_tutoring_sessions) {
          console.warn('⚠️ AI响应字段不完整，但尝试继续处理:', Object.keys(parsed))
          // 不抛出错误，而是尝试处理不完整的响应
        }

        console.log('✅ 返回解析后的AI响应')
        return parsed
      } else {
        console.log('⚠️ 未找到JSON格式，使用备用响应')
        // 如果没有找到JSON格式，创建一个基本的响应结构
        return this.createFallbackResponse(response)
      }

    } catch (error) {
      console.error('❌ 解析AI响应失败:', error)
      console.log('🔧 使用备用响应结构')
      return this.createFallbackResponse(response)
    }
  }

  /**
   * 创建备用响应结构 - 与系统提示词格式一致
   */
  private createFallbackResponse(response: string): AIAnalysisResult {
    return {
      analysis_summary: response.length > 500 ? response.substring(0, 500) + '...' : response,
      weakness_diagnostic: {
        subject: '综合分析',
        chapter: '基础概念',
        knowledge_points: ['需要进一步分析']
      },
      targeted_tutoring_sessions: [
        {
          knowledge_point: 'AI分析结果',
          core_concept_explanation: response.length > 1000 ? response.substring(0, 1000) + '...' : response,
          wrong_question_analysis: {
            question_stem: '分析结果',
            user_answer: '需要改进',
            correct_answer: '持续学习',
            analysis: '建议重点关注薄弱知识点，多做练习。'
          },
          illustrative_examples: [
            '建议多做相关练习题',
            '重点复习基础概念'
          ],
          knowledge_mind_map: {
            title: '学习建议',
            map: [
              '学习建议',
              '  - 重点复习薄弱知识点',
              '  - 多做练习题巩固',
              '  - 查漏补缺'
            ]
          }
        }
      ],
      motivational_message: '继续努力，相信你能够取得进步！'
    }
  }
}

// 导出单例
export const aiAnalysisService = new AIAnalysisService()
