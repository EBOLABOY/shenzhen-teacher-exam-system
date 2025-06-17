import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 生成邀请码
function generateInviteCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 获取邀请码列表
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

    // 获取邀请码列表，同时获取用户信息
    const { data: inviteCodes, error: fetchError } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('获取邀请码失败:', fetchError)
      return NextResponse.json({ error: '获取邀请码失败' }, { status: 500 })
    }

    // 获取相关用户信息
    const allUserIds = [
      ...inviteCodes.map(ic => ic.created_by).filter(Boolean),
      ...inviteCodes.map(ic => ic.used_by).filter(Boolean)
    ]
    const userIds = Array.from(new Set(allUserIds))

    let userProfiles: any[] = []
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      userProfiles = profiles || []
    }

    // 组合数据
    const enrichedInviteCodes = inviteCodes.map(ic => ({
      ...ic,
      created_by_profile: userProfiles.find(p => p.user_id === ic.created_by),
      used_by_profile: userProfiles.find(p => p.user_id === ic.used_by)
    }))

    return NextResponse.json({ inviteCodes: enrichedInviteCodes })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 创建新邀请码
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

    // 生成新的邀请码
    const newCode = generateInviteCode()
    
    // 插入邀请码
    const { data: inviteCode, error: insertError } = await supabase
      .from('invite_codes')
      .insert({
        code: newCode,
        created_by: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
      })
      .select()
      .single()

    if (insertError) {
      console.error('创建邀请码失败:', insertError)
      return NextResponse.json({ 
        error: '创建邀请码失败', 
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: '邀请码创建成功',
      inviteCode 
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
