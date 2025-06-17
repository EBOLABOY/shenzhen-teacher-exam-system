#!/usr/bin/env node
/**
 * 直接创建数据库表的脚本
 * 使用原生SQL而不是RPC函数
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 需要配置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  console.log('🔧 开始创建数据库表...\n');

  try {
    // 1. 创建AI分析表
    console.log('📝 创建AI分析表...');
    const createAiAnalysisQuery = `
      CREATE TABLE IF NOT EXISTS ai_analysis (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        analysis_type TEXT NOT NULL DEFAULT 'weakness_analysis',
        wrong_questions_data JSONB NOT NULL,
        ai_response TEXT NOT NULL,
        weak_subjects JSONB,
        recommendations JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createError } = await supabase
      .from('_temp_sql_execution')
      .select('*')
      .limit(0);

    // 由于无法直接执行DDL，我们需要使用不同的方法
    // 让我们检查表是否存在
    const { data: aiAnalysisCheck, error: checkError } = await supabase
      .from('ai_analysis')
      .select('*')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('❌ AI分析表不存在，需要手动创建');
      console.log('\n请在 Supabase Dashboard 的 SQL Editor 中执行以下SQL:');
      console.log('='.repeat(80));
      console.log(createAiAnalysisQuery);
      console.log('='.repeat(80));
    } else {
      console.log('✅ AI分析表已存在');
    }

    // 2. 检查错题库表的列
    console.log('\n📝 检查错题库表结构...');
    const { data: wrongQuestionsData, error: wrongQuestionsError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);

    if (wrongQuestionsError) {
      console.log('❌ 错题库表不存在或有问题:', wrongQuestionsError.message);
    } else {
      console.log('✅ 错题库表存在');
      
      // 检查是否有数据来验证列结构
      if (wrongQuestionsData && wrongQuestionsData.length > 0) {
        const columns = Object.keys(wrongQuestionsData[0]);
        console.log('📊 现有列:', columns.join(', '));
        
        const requiredColumns = ['mastered_at', 'is_mastered', 'question_type', 'subject', 'difficulty', 'user_answer', 'correct_answer'];
        const missingColumns = requiredColumns.filter(col => !columns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log('❌ 缺失列:', missingColumns.join(', '));
          console.log('\n需要在 Supabase Dashboard 中添加这些列');
        } else {
          console.log('✅ 所有必需列都存在');
        }
      } else {
        console.log('📝 表为空，无法验证列结构');
      }
    }

    // 3. 提供完整的SQL脚本
    console.log('\n📋 完整的数据库设置SQL脚本:');
    console.log('='.repeat(80));
    
    const fullSQL = `
-- 1. 创建AI分析记录表
CREATE TABLE IF NOT EXISTS ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'weakness_analysis',
  wrong_questions_data JSONB NOT NULL,
  ai_response TEXT NOT NULL,
  weak_subjects JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建AI分析表索引
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);

-- 3. 启用AI分析表的RLS
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

-- 4. 创建AI分析表的RLS策略
DROP POLICY IF EXISTS "Users can view own ai analysis" ON ai_analysis;
DROP POLICY IF EXISTS "Users can insert own ai analysis" ON ai_analysis;

CREATE POLICY "Users can view own ai analysis" ON ai_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai analysis" ON ai_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 添加错题库表的缺失列
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS is_mastered BOOLEAN DEFAULT FALSE;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'unknown';
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'unknown';
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS user_answer TEXT DEFAULT '';
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS correct_answer TEXT DEFAULT '';

-- 6. 创建或更新错题库表的索引
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_type ON wrong_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);

-- 7. 确保错题库表的RLS策略存在
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can insert own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can update own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can delete own wrong questions" ON wrong_questions;

CREATE POLICY "Users can view own wrong questions" ON wrong_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wrong questions" ON wrong_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wrong questions" ON wrong_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wrong questions" ON wrong_questions
  FOR DELETE USING (auth.uid() = user_id);

-- 完成提示
SELECT 'Database setup completed successfully!' as status;
`;

    console.log(fullSQL);
    console.log('='.repeat(80));
    
    console.log('\n🎯 下一步操作:');
    console.log('1. 复制上面的SQL脚本');
    console.log('2. 打开 Supabase Dashboard');
    console.log('3. 进入 SQL Editor');
    console.log('4. 粘贴并执行SQL脚本');
    console.log('5. 确认看到 "Database setup completed successfully!" 消息');

  } catch (error) {
    console.error('❌ 脚本执行出错:', error);
  }
}

createTables();
