#!/usr/bin/env node
/**
 * 检查并修复wrong_questions表
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWrongQuestionsTable() {
  console.log('🔍 检查wrong_questions表状态...\n');
  
  try {
    // 尝试查询表
    const { data, error } = await supabase
      .from('wrong_questions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ wrong_questions表查询失败:', error.message);
      
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('📝 表不存在，需要创建...');
        
        // 创建表的SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS wrong_questions (
            id SERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
            wrong_count INTEGER DEFAULT 1,
            last_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_mastered BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, question_id)
          );
          
          -- 创建索引
          CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
          CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_id ON wrong_questions(question_id);
          CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_question ON wrong_questions(user_id, question_id);
          
          -- 启用RLS
          ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
          
          -- 创建RLS策略
          CREATE POLICY "用户只能查看自己的错题" ON wrong_questions
            FOR SELECT
            USING (user_id = auth.uid());
          
          CREATE POLICY "用户只能插入自己的错题" ON wrong_questions
            FOR INSERT
            WITH CHECK (user_id = auth.uid());
          
          CREATE POLICY "用户只能更新自己的错题" ON wrong_questions
            FOR UPDATE
            USING (user_id = auth.uid());
          
          CREATE POLICY "用户只能删除自己的错题" ON wrong_questions
            FOR DELETE
            USING (user_id = auth.uid());
        `;
        
        console.log('正在创建wrong_questions表...');
        console.log('请在Supabase Dashboard的SQL Editor中执行以下SQL:');
        console.log('='.repeat(50));
        console.log(createTableSQL);
        console.log('='.repeat(50));
        
        return;
      } else {
        console.log('❌ 其他错误:', error);
        return;
      }
    }
    
    console.log('✅ wrong_questions表存在且可访问');
    
    // 检查表结构
    const { data: tableData, error: tableError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ 无法读取表数据:', tableError);
    } else {
      console.log('✅ 表结构正常');
      if (tableData && tableData.length > 0) {
        console.log('表字段:', Object.keys(tableData[0]));
      }
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

fixWrongQuestionsTable().then(() => {
  console.log('✅ 检查完成');
  process.exit(0);
}).catch(console.error);
