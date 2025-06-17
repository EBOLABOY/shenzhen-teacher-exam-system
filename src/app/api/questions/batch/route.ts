import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { questions } = body

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: '请提供题目数组' },
        { status: 400 }
      )
    }

    // 验证用户权限（可选：检查是否为管理员）
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // 批量处理题目
    for (const questionData of questions) {
      try {
        const {
          question,
          options,
          answer,
          explanation,
          type,
          subject,
          difficulty,
          exam_year,
          exam_date,
          exam_segment,
          section_type,
          points,
          question_number
        } = questionData

        // 验证必填字段
        if (!question || !options || !answer) {
          errors.push(`题目 "${question?.substring(0, 30)}..." 缺少必填字段`)
          errorCount++
          continue
        }

        // 检查是否已存在相同题目
        const { data: existingQuestions } = await supabase
          .from('questions')
          .select('id')
          .eq('question', question)
          .eq('answer', answer)
          .limit(1)

        if (existingQuestions && existingQuestions.length > 0) {
          // 题目已存在，跳过
          continue
        }

        // 插入新题目
        const { error } = await supabase
          .from('questions')
          .insert([{
            question,
            options,
            answer,
            explanation: explanation || '',
            type: type || 'multiple_choice',
            subject: subject || '教育学',
            difficulty: difficulty || 'medium',
            exam_year,
            exam_date,
            exam_segment,
            section_type,
            points: points || 1.0,
            question_number
          }])

        if (error) {
          errors.push(`题目 "${question.substring(0, 30)}..." 插入失败: ${error.message}`)
          errorCount++
        } else {
          successCount++
        }

      } catch (error: any) {
        errors.push(`处理题目时出错: ${error.message}`)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `批量导入完成`,
      stats: {
        total: questions.length,
        success: successCount,
        error: errorCount,
        skipped: questions.length - successCount - errorCount
      },
      errors: errors.slice(0, 10) // 只返回前10个错误
    })

  } catch (error) {
    console.error('批量导入失败:', error)
    return NextResponse.json(
      { success: false, error: '批量导入失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
