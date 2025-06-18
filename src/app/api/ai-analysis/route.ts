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
      console.log('✅ AI分析成功完成')
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

    // 构建完整的分析内容文本
    let fullAnalysisText = `# AI私教分析报告\n\n`

    // 添加分析摘要
    if (aiAnalysisResult.analysis_summary) {
      fullAnalysisText += `## 整体诊断\n\n${aiAnalysisResult.analysis_summary}\n\n`
    }

    // 添加薄弱点诊断
    if (aiAnalysisResult.weakness_diagnostic) {
      fullAnalysisText += `## 薄弱点定位\n\n`
      fullAnalysisText += `**最薄弱科目：** ${aiAnalysisResult.weakness_diagnostic.subject}\n\n`
      fullAnalysisText += `**重点章节：** ${aiAnalysisResult.weakness_diagnostic.chapter}\n\n`
      if (aiAnalysisResult.weakness_diagnostic.knowledge_points && aiAnalysisResult.weakness_diagnostic.knowledge_points.length > 0) {
        fullAnalysisText += `**具体知识点：**\n`
        aiAnalysisResult.weakness_diagnostic.knowledge_points.forEach(point => {
          fullAnalysisText += `- ${point}\n`
        })
        fullAnalysisText += `\n`
      }
    }

    // 添加靶向教学课堂
    if (aiAnalysisResult.targeted_tutoring_sessions && aiAnalysisResult.targeted_tutoring_sessions.length > 0) {
      fullAnalysisText += `## 靶向教学课堂\n\n`
      aiAnalysisResult.targeted_tutoring_sessions.forEach((session, index) => {
        fullAnalysisText += `### ${index + 1}. ${session.knowledge_point}\n\n`

        if (session.core_concept_explanation) {
          fullAnalysisText += `**💡 核心概念讲解**\n\n${session.core_concept_explanation}\n\n`
        }

        if (session.wrong_question_analysis) {
          fullAnalysisText += `**🔍 错题剖析**\n\n`
          fullAnalysisText += `- **题目：** ${session.wrong_question_analysis.question_stem}\n`
          fullAnalysisText += `- **您的答案：** ${session.wrong_question_analysis.user_answer}\n`
          fullAnalysisText += `- **正确答案：** ${session.wrong_question_analysis.correct_answer}\n`
          fullAnalysisText += `- **分析：** ${session.wrong_question_analysis.analysis}\n\n`
        }

        if (session.illustrative_examples && session.illustrative_examples.length > 0) {
          fullAnalysisText += `**📚 情境化举例**\n\n`
          session.illustrative_examples.forEach((example, i) => {
            fullAnalysisText += `${i + 1}. ${example}\n`
          })
          fullAnalysisText += `\n`
        }

        if (session.knowledge_mind_map) {
          fullAnalysisText += `**🗺️ ${session.knowledge_mind_map.title}**\n\n`

          // 添加文字总结
          if (session.knowledge_mind_map.summary) {
            fullAnalysisText += `${session.knowledge_mind_map.summary}\n\n`
          }

          // 添加SVG图表
          if (session.knowledge_mind_map.svg_chart) {
            fullAnalysisText += `${session.knowledge_mind_map.svg_chart}\n\n`
          }

          // 保留文本版本作为备用
          if (session.knowledge_mind_map.map && session.knowledge_mind_map.map.length > 0) {
            session.knowledge_mind_map.map.forEach(item => {
              fullAnalysisText += `${item}\n`
            })
          }
          fullAnalysisText += `\n`
        }
      })
    }

    // 添加激励信息
    if (aiAnalysisResult.motivational_message) {
      fullAnalysisText += `## 学习激励\n\n${aiAnalysisResult.motivational_message}\n\n`
    }

    // 转换为兼容格式
    const aiAnalysis = {
      weakSubjects: [{
        subject: aiAnalysisResult.weakness_diagnostic.subject,
        chapter: aiAnalysisResult.weakness_diagnostic.chapter,
        knowledge_points: aiAnalysisResult.weakness_diagnostic.knowledge_points,
        analysis: aiAnalysisResult.analysis_summary,
        recommendations: aiAnalysisResult.targeted_tutoring_sessions.map(session => session.core_concept_explanation)
      }],
      recommendations: aiAnalysisResult.targeted_tutoring_sessions.map(session => session.core_concept_explanation),
      fullAnalysis: fullAnalysisText // 使用完整的格式化文本
    }

    // 统计数据（用于兼容性）
    const subjectStats: Record<string, any> = {}
    const difficultyStats: Record<string, number> = {}
    const questionTypeStats: Record<string, number> = {}

    wrongQuestions.forEach(wq => {
      const subject = wq.subject
      const difficulty = wq.difficulty
      const questionType = wq.question_type

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
      subjectStats[subject].questions.push(wq.questions?.question || '')

      // 难度统计
      if (difficulty) {
        difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1
      }

      // 题型统计
      questionTypeStats[questionType] = (questionTypeStats[questionType] || 0) + 1
    })

    // 保存分析结果
    const { data: analysisRecord, error: saveError } = await supabase
      .from('ai_analysis')
      .insert({
        user_id: user.id,
        analysis_type: 'weakness_analysis',
        wrong_questions_data: {
          totalQuestions: wrongQuestions.length,
          subjectStats,
          difficultyStats,
          questionTypeStats,
          aiAnalysisResult // 保存完整的AI分析结果
        },
        ai_response: aiAnalysis.fullAnalysis,
        weak_subjects: aiAnalysis.weakSubjects,
        recommendations: aiAnalysis.recommendations
      })
      .select()
      .single()

    if (saveError) {
      console.error('保存分析结果失败:', saveError)
      // 不影响返回结果，只记录错误
    }

    return NextResponse.json({
      analysis: {
        totalWrongQuestions: wrongQuestions.length,
        subjectStats,
        difficultyStats,
        questionTypeStats,
        weakSubjects: aiAnalysis.weakSubjects,
        recommendations: aiAnalysis.recommendations,
        fullAnalysis: aiAnalysis.fullAnalysis,
        studyPlan: aiAnalysisResult.targeted_tutoring_sessions,
        motivationalMessage: aiAnalysisResult.motivational_message,
        analysisId: analysisRecord?.id
      }
    })

  } catch (error) {
    console.error('AI分析错误:', error)
    return NextResponse.json({ error: '分析过程中出现错误' }, { status: 500 })
  }
}


