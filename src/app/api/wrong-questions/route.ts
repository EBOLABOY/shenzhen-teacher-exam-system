import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 获取错题列表
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const questionType = searchParams.get('question_type')
    const isMastered = searchParams.get('is_mastered')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 构建查询
    let query = supabase
      .from('wrong_questions')
      .select(`
        *,
        questions (
          id,
          question,
          options,
          answer,
          explanation,
          subject,
          difficulty
        )
      `)
      .eq('user_id', user.id)
      .order('last_wrong_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 添加过滤条件
    if (subject) {
      query = query.eq('subject', subject)
    }
    if (questionType) {
      query = query.eq('question_type', questionType)
    }
    if (isMastered !== null) {
      query = query.eq('is_mastered', isMastered === 'true')
    }

    const { data: wrongQuestions, error } = await query

    if (error) {
      console.error('获取错题失败:', error)
      return NextResponse.json({ error: '获取错题失败' }, { status: 500 })
    }

    // 获取总数
    let countQuery = supabase
      .from('wrong_questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (subject) countQuery = countQuery.eq('subject', subject)
    if (questionType) countQuery = countQuery.eq('question_type', questionType)
    if (isMastered !== null) countQuery = countQuery.eq('is_mastered', isMastered === 'true')

    const { count } = await countQuery

    return NextResponse.json({
      data: wrongQuestions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 添加错题
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

    const body = await request.json()
    const { 
      question_id, 
      user_answer, 
      correct_answer, 
      question_type, 
      subject, 
      difficulty 
    } = body

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('wrong_questions')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', question_id)
      .single()

    if (existing) {
      // 更新错误次数和最后错误时间
      const { data, error } = await supabase
        .from('wrong_questions')
        .update({
          user_answer,
          wrong_count: existing.wrong_count + 1,
          last_wrong_at: new Date().toISOString(),
          is_mastered: false,
          mastered_at: null
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('更新错题失败:', error)
        return NextResponse.json({ error: '更新错题失败' }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // 创建新错题记录
      const { data, error } = await supabase
        .from('wrong_questions')
        .insert({
          user_id: user.id,
          question_id,
          user_answer,
          correct_answer,
          question_type,
          subject,
          difficulty
        })
        .select()
        .single()

      if (error) {
        console.error('添加错题失败:', error)
        return NextResponse.json({ error: '添加错题失败' }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
