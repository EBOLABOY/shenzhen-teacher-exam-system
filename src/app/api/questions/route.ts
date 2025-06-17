import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'


export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const subject = searchParams.get('subject')
    const difficulty = searchParams.get('difficulty')
    const random = searchParams.get('random') === 'true'

    // 构建查询
    let query = supabase
      .from('questions')
      .select('*')

    // 根据科目筛选
    if (subject) {
      query = query.eq('subject', subject)
    }

    // 根据难度筛选
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    // 限制返回数量
    query = query.limit(limit)

    // 如果需要随机排序
    if (random) {
      // PostgreSQL 随机排序
      query = query.order('id', { ascending: false })
    } else {
      query = query.order('id', { ascending: true })
    }

    const { data: questions, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: questions || [],
      total: questions?.length || 0
    })
  } catch (error) {
    console.error('获取题目失败:', error)
    return NextResponse.json(
      { success: false, error: '获取题目失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
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
    const body = await request.json()
    const { question, options, answer, explanation, type, subject, difficulty, exam_year, exam_date, exam_segment, section_type, points, question_number } = body

    // 验证必填字段
    if (!question || !options || !answer) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：question, options, answer' },
        { status: 400 }
      )
    }

    // 检查是否已存在相同题目（简单去重）
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('id')
      .eq('question', question)
      .eq('answer', answer)
      .limit(1)

    if (existingQuestions && existingQuestions.length > 0) {
      return NextResponse.json({
        success: true,
        data: existingQuestions[0],
        message: '题目已存在，跳过重复导入'
      })
    }

    // 插入新题目到数据库
    const { data, error } = await supabase
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
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '题目导入成功'
    })
  } catch (error) {
    console.error('创建题目失败:', error)
    return NextResponse.json(
      { success: false, error: '创建题目失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}
