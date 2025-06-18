import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { aiAnalysisService } from '@/services/ai-service'

// AI分析错题，识别薄弱知识点
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取用户的错题数据
    const { data: wrongQuestions, error: fetchError } = await supabase
      .from('wrong_questions')
      .select(`
        *,
        questions (
          id,
          question,
          options,
          answer,
          subject,
          difficulty,
          explanation
        )
      `)
      .eq('user_id', user.id)
      .eq('is_mastered', false)
      .order('last_wrong_at', { ascending: false })
      .limit(100) // 分析最近100道错题

    if (fetchError) {
      console.error('获取错题数据失败:', fetchError)
      return NextResponse.json({ error: '获取错题数据失败' }, { status: 500 })
    }

    if (!wrongQuestions || wrongQuestions.length === 0) {
      return NextResponse.json({ 
        message: '暂无错题数据，无法进行分析',
        analysis: {
          totalWrongQuestions: 0,
          weakSubjects: [],
          recommendations: ['继续练习，积累错题后可获得个性化分析']
        }
      })
    }

    console.log('🤖 开始AI分析，错题数量:', wrongQuestions.length)

    // 调用真实的AI分析服务
    let aiAnalysisResult
    try {
      aiAnalysisResult = await aiAnalysisService.analyzeWrongQuestions(wrongQuestions)
      console.log('✅ AI分析成功完成，返回Markdown内容')

      // 直接返回Markdown内容
      return NextResponse.json({
        analysis: {
          totalWrongQuestions: wrongQuestions.length,
          fullAnalysis: aiAnalysisResult.markdownContent,
          isMarkdown: true
        }
      })
    } catch (aiError) {
      console.error('❌ AI分析失败:', aiError)

      // 提供备用分析结果
      const fallbackAnalysis = {
        analysis_summary: `基于您的${wrongQuestions.length}道错题进行了初步分析。虽然AI分析遇到了技术问题，但我们仍为您提供基础的学习建议。`,
        weakness_diagnostic: {
          subject: wrongQuestions.length > 0 ? wrongQuestions[0].subject : '综合分析',
          chapter: '基础概念复习',
          knowledge_points: ['建议重点复习基础概念', '加强练习薄弱知识点']
        },
        targeted_tutoring_sessions: [
          {
            knowledge_point: '基础知识巩固',
            core_concept_explanation: '建议您系统性地复习相关基础概念，通过大量练习来巩固知识点。',
            wrong_question_analysis: {
              question_stem: '综合分析您的错题情况',
              user_answer: '需要改进',
              correct_answer: '持续学习',
              analysis: '通过分析您的错题模式，建议重点关注基础概念的理解和应用。'
            },
            illustrative_examples: [
              '建议制定系统的复习计划',
              '多做相关练习题加强记忆'
            ],
            knowledge_mind_map: {
              title: '学习改进建议',
              summary: '基于错题分析的学习建议，帮助您系统性地提升学习效果。',
              map: [
                '学习改进计划',
                '  - 基础概念复习',
                '  - 重点知识点强化',
                '  - 练习题巩固',
                '  - 定期自我检测'
              ]
            }
          }
        ],
        motivational_message: '学习是一个持续的过程，每一次错题都是进步的机会。继续努力，您一定能够取得更好的成绩！'
      }

      // 构建备用分析文本
      let fallbackText = `# AI学习分析报告\n\n## 整体诊断\n\n${fallbackAnalysis.analysis_summary}\n\n`
      fallbackText += `## 薄弱点定位\n\n**主要科目：** ${fallbackAnalysis.weakness_diagnostic.subject}\n\n`
      fallbackText += `**重点章节：** ${fallbackAnalysis.weakness_diagnostic.chapter}\n\n`
      fallbackText += `**具体建议：**\n${fallbackAnalysis.weakness_diagnostic.knowledge_points.map(point => `- ${point}`).join('\n')}\n\n`
      fallbackText += `## 学习建议\n\n${fallbackAnalysis.targeted_tutoring_sessions[0].core_concept_explanation}\n\n`
      fallbackText += `## 激励信息\n\n${fallbackAnalysis.motivational_message}`

      return NextResponse.json({
        analysis: {
          totalWrongQuestions: wrongQuestions.length,
          weakSubjects: [fallbackAnalysis.weakness_diagnostic],
          recommendations: [fallbackAnalysis.targeted_tutoring_sessions[0].core_concept_explanation],
          fullAnalysis: fallbackText,
          studyPlan: fallbackAnalysis.targeted_tutoring_sessions,
          motivationalMessage: fallbackAnalysis.motivational_message,
          fallback: true
        }
      })
    }


  } catch (error) {
    console.error('AI分析错误:', error)
    return NextResponse.json({ error: '分析过程中出现错误' }, { status: 500 })
  }
}


