import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 获取用户列表（管理员专用）
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

    // 获取用户列表
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('获取用户配置失败:', profilesError)
      return NextResponse.json({ error: '获取用户配置失败' }, { status: 500 })
    }

    // 获取用户进度数据
    let usersWithProgress = profiles
    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.user_id)

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .in('user_id', userIds)

      if (progressError) {
        console.warn('获取用户进度失败:', progressError)
      } else {
        // 合并数据
        usersWithProgress = profiles.map(profile => ({
          ...profile,
          user_progress: progressData?.filter(p => p.user_id === profile.user_id) || []
        }))
      }
    }

    return NextResponse.json({ users: usersWithProgress })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 批量操作用户（管理员专用）
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

    const body = await request.json()
    const { action, userIds, data: actionData } = body

    switch (action) {
      case 'updateRole':
        // 批量更新用户角色
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ is_admin: actionData.isAdmin })
          .in('user_id', userIds)

        if (updateError) {
          throw updateError
        }

        return NextResponse.json({ 
          message: `成功更新 ${userIds.length} 个用户的角色` 
        })

      case 'delete':
        // 批量删除用户（删除相关数据）
        for (const userId of userIds) {
          // 删除用户相关数据
          await supabase.from('user_answers').delete().eq('user_id', userId)
          await supabase.from('user_progress').delete().eq('user_id', userId)
          await supabase.from('wrong_questions').delete().eq('user_id', userId)
          await supabase.from('user_profiles').delete().eq('user_id', userId)
        }

        return NextResponse.json({ 
          message: `成功删除 ${userIds.length} 个用户` 
        })

      case 'resetProgress':
        // 重置用户学习进度
        await supabase.from('user_answers').delete().in('user_id', userIds)
        await supabase.from('user_progress').delete().in('user_id', userIds)
        await supabase.from('wrong_questions').delete().in('user_id', userIds)

        return NextResponse.json({ 
          message: `成功重置 ${userIds.length} 个用户的学习进度` 
        })

      default:
        return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
    }

  } catch (error) {
    console.error('批量操作失败:', error)
    return NextResponse.json({ 
      error: '批量操作失败', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
