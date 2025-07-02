import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { resetType = 'all', confirmCode } = body

    // 安全确认码检查
    if (confirmCode !== 'RESET_MY_PROGRESS') {
      return NextResponse.json({ 
        error: '请提供正确的确认码：RESET_MY_PROGRESS' 
      }, { status: 400 })
    }

    let deletedRecords = 0
    const results = []

    try {
      // 根据重置类型执行不同的操作
      if (resetType === 'all' || resetType === 'answers') {
        // 删除用户答题记录
        const { count: answersCount, error: answersError } = await supabase
          .from('user_answers')
          .delete()
          .eq('user_id', user.id)

        if (answersError) {
          console.error('删除答题记录失败:', answersError)
          results.push({ type: 'answers', success: false, error: answersError.message })
        } else {
          deletedRecords += answersCount || 0
          results.push({ type: 'answers', success: true, count: answersCount })
        }
      }

      if (resetType === 'all' || resetType === 'wrong_questions') {
        // 删除错题记录
        const { count: wrongCount, error: wrongError } = await supabase
          .from('wrong_questions')
          .delete()
          .eq('user_id', user.id)

        if (wrongError) {
          console.error('删除错题记录失败:', wrongError)
          results.push({ type: 'wrong_questions', success: false, error: wrongError.message })
        } else {
          deletedRecords += wrongCount || 0
          results.push({ type: 'wrong_questions', success: true, count: wrongCount })
        }
      }

      if (resetType === 'all' || resetType === 'progress') {
        // 重置用户进度统计
        const { error: progressError } = await supabase
          .from('user_progress')
          .update({
            total_questions: 0,
            correct_answers: 0,
            total_time: 0,
            streak_days: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (progressError) {
          console.error('重置进度统计失败:', progressError)
          results.push({ type: 'progress', success: false, error: progressError.message })
        } else {
          results.push({ type: 'progress', success: true })
        }
      }

      if (resetType === 'all' || resetType === 'tasks') {
        // 删除练习任务
        const { count: tasksCount, error: tasksError } = await supabase
          .from('practice_tasks')
          .delete()
          .eq('user_id', user.id)

        if (tasksError) {
          console.error('删除练习任务失败:', tasksError)
          results.push({ type: 'tasks', success: false, error: tasksError.message })
        } else {
          deletedRecords += tasksCount || 0
          results.push({ type: 'tasks', success: true, count: tasksCount })
        }
      }

      // 检查是否有失败的操作
      const hasErrors = results.some(r => !r.success)

      return NextResponse.json({
        success: !hasErrors,
        message: hasErrors ? '部分重置操作失败' : '用户进度重置成功',
        deletedRecords,
        results,
        resetType,
        timestamp: new Date().toISOString()
      })

    } catch (error: any) {
      console.error('重置用户进度时出错:', error)
      return NextResponse.json({
        success: false,
        error: '重置操作失败',
        details: error.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('API错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      details: error.message
    }, { status: 500 })
  }
}

// 获取用户进度信息
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

    // 获取用户各项数据统计
    const [answersResult, wrongQuestionsResult, progressResult, tasksResult] = await Promise.all([
      supabase.from('user_answers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('wrong_questions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('user_progress').select('*').eq('user_id', user.id).single(),
      supabase.from('practice_tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    ])

    return NextResponse.json({
      success: true,
      data: {
        answers_count: answersResult.count || 0,
        wrong_questions_count: wrongQuestionsResult.count || 0,
        progress: progressResult.data,
        tasks_count: tasksResult.count || 0
      }
    })

  } catch (error: any) {
    console.error('获取用户进度信息失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取进度信息失败'
    }, { status: 500 })
  }
}
