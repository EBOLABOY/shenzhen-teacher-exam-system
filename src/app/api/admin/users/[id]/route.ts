import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 获取单个用户详细信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id

    // 获取用户详细信息
    const { data: targetUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        user_progress(*),
        user_answers(
          id,
          question_id,
          user_answer,
          is_correct,
          created_at,
          questions(subject, difficulty, question_type)
        ),
        wrong_questions(
          id,
          question_id,
          wrong_count,
          last_wrong_at,
          is_mastered,
          questions(subject, difficulty, question_type)
        )
      `)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('获取用户信息失败:', fetchError)
      return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 })
    }

    return NextResponse.json({ user: targetUser })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 更新用户信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id
    const body = await request.json()
    const { display_name, is_admin } = body

    // 防止管理员修改自己的权限
    if (userId === user.id && is_admin === false) {
      return NextResponse.json({ error: '不能移除自己的管理员权限' }, { status: 400 })
    }

    // 更新用户信息
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        display_name,
        is_admin,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('更新用户信息失败:', updateError)
      return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: '用户信息更新成功',
      user: updatedUser 
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const userId = params.id

    // 防止管理员删除自己
    if (userId === user.id) {
      return NextResponse.json({ error: '不能删除自己的账户' }, { status: 400 })
    }

    // 删除用户相关数据（按依赖关系顺序删除）
    await supabase.from('user_answers').delete().eq('user_id', userId)
    await supabase.from('user_progress').delete().eq('user_id', userId)
    await supabase.from('wrong_questions').delete().eq('user_id', userId)
    
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('删除用户失败:', deleteError)
      return NextResponse.json({ error: '删除用户失败' }, { status: 500 })
    }

    return NextResponse.json({ message: '用户删除成功' })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
