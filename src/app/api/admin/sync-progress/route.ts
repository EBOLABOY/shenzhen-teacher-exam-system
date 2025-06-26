import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// 批量同步所有用户的学习进度统计（管理员专用）
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

    // 检查用户是否为管理员
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile?.is_admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // 获取所有用户
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')

    if (usersError) {
      console.error('获取用户列表失败:', usersError)
      return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
    }

    const syncResults = []
    let successCount = 0
    let errorCount = 0

    // 同步每个用户的进度
    for (const userProfile of users) {
      try {
        // 获取用户的所有答题记录
        const { data: answers, error: answersError } = await supabase
          .from('user_answers')
          .select('is_correct, time_spent, answered_at')
          .eq('user_id', userProfile.user_id)

        if (answersError) {
          console.error(`获取用户 ${userProfile.user_id} 答题记录失败:`, answersError)
          syncResults.push({
            user_id: userProfile.user_id,
            display_name: userProfile.display_name,
            success: false,
            error: '获取答题记录失败'
          })
          errorCount++
          continue
        }

        // 计算统计数据
        const totalQuestions = answers.length
        const correctAnswers = answers.filter(a => a.is_correct).length
        const totalTime = answers.reduce((sum, a) => sum + (a.time_spent || 0), 0)
        
        const lastPracticeAt = answers.length > 0 
          ? answers.reduce((latest, a) => {
              const answerTime = new Date(a.answered_at)
              return answerTime > new Date(latest) ? a.answered_at : latest
            }, answers[0].answered_at)
          : null

        // 更新用户进度表
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            total_questions: totalQuestions,
            correct_answers: correctAnswers,
            total_time: totalTime,
            last_practice_at: lastPracticeAt,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userProfile.user_id)

        if (updateError) {
          console.error(`更新用户 ${userProfile.user_id} 进度失败:`, updateError)
          syncResults.push({
            user_id: userProfile.user_id,
            display_name: userProfile.display_name,
            success: false,
            error: '更新进度失败'
          })
          errorCount++
        } else {
          const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
          syncResults.push({
            user_id: userProfile.user_id,
            display_name: userProfile.display_name,
            success: true,
            stats: {
              total_questions: totalQuestions,
              correct_answers: correctAnswers,
              accuracy: accuracy,
              total_time: totalTime
            }
          })
          successCount++
        }
      } catch (error) {
        console.error(`同步用户 ${userProfile.user_id} 进度时出现错误:`, error)
        syncResults.push({
          user_id: userProfile.user_id,
          display_name: userProfile.display_name,
          success: false,
          error: '同步过程中出现异常'
        })
        errorCount++
      }
    }

    return NextResponse.json({
      message: `批量同步完成：成功 ${successCount} 个，失败 ${errorCount} 个`,
      summary: {
        total: users.length,
        success: successCount,
        error: errorCount
      },
      results: syncResults
    })

  } catch (error) {
    console.error('批量同步用户进度失败:', error)
    return NextResponse.json({ 
      error: '服务器内部错误', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 获取同步状态信息
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

    // 检查用户是否为管理员
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile?.is_admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    // 获取统计信息
    const { data: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })

    const { data: totalAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('id', { count: 'exact', head: true })

    const { data: totalProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('user_id', { count: 'exact', head: true })

    return NextResponse.json({
      stats: {
        total_users: totalUsers || 0,
        total_answers: totalAnswers || 0,
        users_with_progress: totalProgress || 0,
        sync_needed: (totalUsers || 0) > (totalProgress || 0)
      }
    })

  } catch (error) {
    console.error('获取同步状态失败:', error)
    return NextResponse.json({ 
      error: '服务器内部错误', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
