const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.error('请确保 .env.local 文件中包含:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndCreatePracticeTasksTable() {
  try {
    console.log('🔍 检查 practice_tasks 表是否存在...')
    
    // 检查表是否存在 - 尝试直接查询表
    const { data: testQuery, error: tablesError } = await supabase
      .from('practice_tasks')
      .select('id')
      .limit(1)
    
    if (tablesError) {
      if (tablesError.code === '42P01') {
        console.log('❌ practice_tasks 表不存在')
      } else {
        console.error('❌ 检查表失败:', tablesError)
        return
      }
    }

    if (!tablesError) {
      console.log('✅ practice_tasks 表已存在')
      
      // 测试插入一条记录
      console.log('🧪 测试插入记录...')
      const testData = {
        user_id: '00000000-0000-0000-0000-000000000000', // 测试用户ID
        task_type: 'test',
        title: '测试任务',
        description: '这是一个测试任务',
        question_ids: ['test-id'],
        total_questions: 1,
        completed_questions: 0,
        status: 'pending'
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('practice_tasks')
        .insert(testData)
        .select()
      
      if (insertError) {
        console.error('❌ 测试插入失败:', insertError)
        console.log('错误详情:', JSON.stringify(insertError, null, 2))
      } else {
        console.log('✅ 测试插入成功')
        
        // 删除测试记录
        if (insertData && insertData[0]) {
          await supabase
            .from('practice_tasks')
            .delete()
            .eq('id', insertData[0].id)
          console.log('🗑️ 测试记录已删除')
        }
      }
    } else {
      console.log('❌ practice_tasks 表不存在，正在创建...')
      
      // 读取SQL文件
      const sqlPath = path.join(__dirname, 'database', 'create_practice_tasks_table.sql')
      if (!fs.existsSync(sqlPath)) {
        console.error('❌ SQL文件不存在:', sqlPath)
        return
      }
      
      const sql = fs.readFileSync(sqlPath, 'utf8')
      
      // 执行SQL
      const { error: createError } = await supabase.rpc('exec_sql', { sql })
      
      if (createError) {
        console.error('❌ 创建表失败:', createError)
        
        // 尝试直接执行SQL语句
        console.log('🔄 尝试分段执行SQL...')
        const statements = sql.split(';').filter(stmt => stmt.trim())
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
              if (error) {
                console.error('❌ 执行语句失败:', statement.substring(0, 50) + '...', error)
              } else {
                console.log('✅ 执行成功:', statement.substring(0, 50) + '...')
              }
            } catch (err) {
              console.error('❌ 执行异常:', err)
            }
          }
        }
      } else {
        console.log('✅ practice_tasks 表创建成功')
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error)
  }
}

// 运行检查
checkAndCreatePracticeTasksTable()
