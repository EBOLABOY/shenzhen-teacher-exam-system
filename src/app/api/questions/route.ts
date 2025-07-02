import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'


export async function GET(request: NextRequest) {
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

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const subject = searchParams.get('subject')
    const difficulty = searchParams.get('difficulty')
    const random = searchParams.get('random') === 'true'
    const excludeAnswered = searchParams.get('exclude_answered') === 'true'

    // 构建查询
    let query = supabase
      .from('questions')
      .select('*')

    // 如果需要排除已做题目且用户已登录
    if (excludeAnswered && user) {
      // 获取用户已做过的题目ID
      const { data: userAnswers } = await supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', user.id)

      const answeredQuestionIds = userAnswers?.map(answer => answer.question_id) || []

      // 排除已做过的题目
      if (answeredQuestionIds.length > 0) {
        query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`)
      }
    }

    // 根据科目筛选
    if (subject) {
      query = query.eq('subject', subject)
    }

    // 根据难度筛选
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    // 如果需要随机排序，获取更多数据用于随机选择
    if (random) {
      // 先获取总数量
      const { count: totalCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .not('id', 'in', excludeAnswered && user && answeredQuestionIds.length > 0 ? `(${answeredQuestionIds.join(',')})` : '(0)')

      // 计算合适的获取数量：至少是limit的2倍，但不超过剩余题目总数
      const fetchLimit = Math.min(Math.max(limit * 2, 50), totalCount || limit)
      query = query.limit(fetchLimit)
    } else {
      query = query.limit(limit)
    }

    query = query.order('id', { ascending: !random })

    const { data: questions, error } = await query

    if (error) {
      throw error
    }

    let finalQuestions = questions || []

    // 如果需要随机排序，使用Fisher-Yates算法进行真正的随机选择
    if (random && finalQuestions.length > 0) {
      // Fisher-Yates洗牌算法
      for (let i = finalQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]]
      }
      finalQuestions = finalQuestions.slice(0, limit)
    }

    // 格式化题目数据，确保选项是对象格式
    const formattedQuestions = finalQuestions.map(q => {
      // 确保选项是对象格式
      let options = q.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch (e) {
          console.error('解析选项失败:', e, '原始数据:', options);
          options = {};
        }
      }

      return {
        ...q,
        options: options
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedQuestions,
      total: formattedQuestions.length,
      excluded_count: excludeAnswered && user ?
        (await supabase.from('user_answers').select('question_id', { count: 'exact' }).eq('user_id', user.id)).count || 0 : 0
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
