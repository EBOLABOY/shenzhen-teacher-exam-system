const { createClient } = require('@supabase/supabase-js')

// 使用service role key来管理RLS策略
const supabaseUrl = 'https://unqsuihbxfevuzqthdwg.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucXN1aWhieGZldnV6cXRoZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA1Mjk5NiwiZXhwIjoyMDY1NjI4OTk2fQ.Hs8_5Ow_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql_Ql'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function fixRLSPolicies() {
  console.log('🔧 开始修复wrong_questions表的RLS策略...')
  
  try {
    // 1. 检查当前RLS策略
    console.log('\n📋 检查当前RLS策略...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'wrong_questions' })
    
    if (policiesError) {
      console.log('无法查询策略，尝试直接创建...')
    } else {
      console.log('当前策略:', policies)
    }

    // 2. 删除可能存在的旧策略
    console.log('\n🗑️ 清理旧策略...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own wrong questions" ON wrong_questions;',
      'DROP POLICY IF EXISTS "Users can insert own wrong questions" ON wrong_questions;',
      'DROP POLICY IF EXISTS "Users can update own wrong questions" ON wrong_questions;',
      'DROP POLICY IF EXISTS "Users can delete own wrong questions" ON wrong_questions;'
    ]

    for (const sql of dropPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql })
        console.log('✅ 删除策略成功')
      } catch (e) {
        console.log('⚠️ 策略可能不存在，跳过')
      }
    }

    // 3. 创建新的RLS策略
    console.log('\n🛡️ 创建新的RLS策略...')
    
    const newPolicies = [
      // 查询策略 - 用户只能查看自己的错题
      `CREATE POLICY "Users can view own wrong questions" ON wrong_questions
       FOR SELECT USING (auth.uid() = user_id);`,
      
      // 插入策略 - 用户只能插入自己的错题
      `CREATE POLICY "Users can insert own wrong questions" ON wrong_questions
       FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      // 更新策略 - 用户只能更新自己的错题
      `CREATE POLICY "Users can update own wrong questions" ON wrong_questions
       FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
      
      // 删除策略 - 用户只能删除自己的错题
      `CREATE POLICY "Users can delete own wrong questions" ON wrong_questions
       FOR DELETE USING (auth.uid() = user_id);`
    ]

    for (const sql of newPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql })
        console.log('✅ 创建策略成功')
      } catch (e) {
        console.error('❌ 创建策略失败:', e.message)
      }
    }

    // 4. 确保RLS已启用
    console.log('\n🔒 启用RLS...')
    try {
      await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;' 
      })
      console.log('✅ RLS已启用')
    } catch (e) {
      console.log('⚠️ RLS可能已经启用')
    }

    // 5. 测试策略
    console.log('\n🧪 测试RLS策略...')
    
    // 使用普通用户权限测试
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucXN1aWhieGZldnV6cXRoZHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTI5OTYsImV4cCI6MjA2NTYyODk5Nn0.WA3I-42ptS9Y3aHYG0lHxtrJ2HAxzeolFwqX0CAmncE')
    
    // 模拟登录用户测试
    const testUserId = '7072c4d7-a05d-4144-9656-481b68a63bfb' // 使用您的用户ID
    
    const { data: testData, error: testError } = await supabase
      .from('wrong_questions')
      .select('id, wrong_count')
      .eq('user_id', testUserId)
      .limit(1)
    
    if (testError) {
      console.error('❌ 测试查询失败:', testError.message)
    } else {
      console.log('✅ 测试查询成功，返回记录数:', testData?.length || 0)
    }

    console.log('\n🎉 RLS策略修复完成！')
    
  } catch (error) {
    console.error('❌ 修复RLS策略失败:', error.message)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixRLSPolicies().then(() => {
    console.log('\n✅ 脚本执行完成')
    process.exit(0)
  }).catch(error => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })
}

module.exports = { fixRLSPolicies }
