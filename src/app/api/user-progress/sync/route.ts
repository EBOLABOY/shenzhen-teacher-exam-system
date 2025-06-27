import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 同步用户进度统计
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取用户的所有答题记录
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('is_correct, time_spent, answered_at')
      .eq('user_id', user.id)

    if (answersError) {
      console.error('获取答题记录失败:', answersError)
      return NextResponse.json({ error: '获取答题记录失败' }, { status: 500 })
    }

    // 计算统计数据
    const totalQuestions = answers.length
    const correctAnswers = answers.filter(a => a.is_correct).length
    const totalTime = answers.reduce((sum, a) => sum + (a.time_spent || 0), 0)
    
    // 找到最后一次答题时间
    const lastPracticeAt = answers.length > 0 
      ? answers.reduce((latest, a) => {
          const answerTime = new Date(a.answered_at)
          return answerTime > new Date(latest) ? a.answered_at : latest
        }, answers[0].answered_at)
      : null

    // 先尝试更新，如果不存在则插入
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let updateError = null;

    if (existingProgress) {
      // 记录存在，执行更新
      const { error } = await supabase
        .from('user_progress')
        .update({
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          total_time: totalTime,
          last_practice_at: lastPracticeAt,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
      updateError = error;
    } else {
      // 记录不存在，执行插入
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          total_time: totalTime,
          last_practice_at: lastPracticeAt,
          updated_at: new Date().toISOString()
        })
      updateError = error;
    }

    if (updateError) {
      console.error('更新用户进度失败:', updateError)
      return NextResponse.json({ error: '更新用户进度失败' }, { status: 500 })
    }

    return NextResponse.json({
      message: '用户进度同步成功',
      stats: {
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        total_time: totalTime,
        accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
      }
    })

  } catch (error) {
    console.error('同步用户进度失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 获取用户进度统计
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 获取用户进度
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (progressError) {
      console.error('获取用户进度失败:', progressError)
      return NextResponse.json({ error: '获取用户进度失败' }, { status: 500 })
    }

    return NextResponse.json({ progress })

  } catch (error) {
    console.error('获取用户进度失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
