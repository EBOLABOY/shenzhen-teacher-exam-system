#!/usr/bin/env node
/**
 * 简化的数据库设置脚本
 * 直接执行SQL创建表
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 需要配置 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupDatabase() {
  console.log('🔧 开始设置数据库...\n');

  try {
    // 检查错题库表是否存在
    console.log('📝 检查错题库表...');
    const { data: existingWrongQuestions, error: checkError1 } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);

    if (checkError1 && checkError1.code === 'PGRST106') {
      console.log('❌ 错题库表不存在，需要手动创建');
      console.log('\n请在 Supabase Dashboard 的 SQL Editor 中执行以下SQL:');
      console.log('='.repeat(60));
      console.log(`
-- 创建错题库表
CREATE TABLE IF NOT EXISTS wrong_questions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  question_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT,
  wrong_count INTEGER DEFAULT 1,
  first_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_mastered BOOLEAN DEFAULT FALSE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保同一用户同一题目只有一条记录
  UNIQUE(user_id, question_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_type ON wrong_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_created_at ON wrong_questions(created_at);

-- 创建AI分析记录表
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

-- AI分析表索引
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);

-- 启用RLS
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

-- 错题库RLS策略
CREATE POLICY "Users can view own wrong questions" ON wrong_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wrong questions" ON wrong_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wrong questions" ON wrong_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wrong questions" ON wrong_questions
  FOR DELETE USING (auth.uid() = user_id);

-- AI分析RLS策略
CREATE POLICY "Users can view own ai analysis" ON ai_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai analysis" ON ai_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_wrong_questions_updated_at 
  BEFORE UPDATE ON wrong_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('='.repeat(60));
      console.log('\n执行完成后，重新运行此脚本进行验证。');
      return;
    } else if (checkError1) {
      console.error('❌ 检查错题库表时出错:', checkError1);
      return;
    } else {
      console.log('✅ 错题库表已存在');
    }

    // 检查AI分析表是否存在
    console.log('📝 检查AI分析表...');
    const { data: existingAiAnalysis, error: checkError2 } = await supabase
      .from('ai_analysis')
      .select('*')
      .limit(1);

    if (checkError2 && checkError2.code === 'PGRST106') {
      console.log('❌ AI分析表不存在，请先执行上面的SQL创建表');
      return;
    } else if (checkError2) {
      console.error('❌ 检查AI分析表时出错:', checkError2);
      return;
    } else {
      console.log('✅ AI分析表已存在');
    }

    // 测试插入和查询
    console.log('\n📊 测试数据库功能...');
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  未登录用户，跳过功能测试');
      console.log('请先登录系统，然后重新运行此脚本进行完整测试');
    } else {
      console.log(`✅ 当前用户: ${user.email}`);
      
      // 测试查询错题
      const { data: wrongQuestions, error: queryError } = await supabase
        .from('wrong_questions')
        .select('*')
        .limit(5);

      if (queryError) {
        console.error('❌ 查询错题失败:', queryError);
      } else {
        console.log(`✅ 错题查询成功，当前错题数: ${wrongQuestions.length}`);
      }
    }

    console.log('\n🎉 数据库验证完成！');
    console.log('现在可以使用以下功能:');
    console.log('- ✅ 错题自动收集');
    console.log('- ✅ 错题重做和掌握标记');
    console.log('- ✅ AI智能分析');
    console.log('- ✅ 个性化学习建议');

  } catch (error) {
    console.error('❌ 数据库设置过程中出现异常:', error);
  }
}

// 运行设置
if (require.main === module) {
  console.log('🔧 数据库设置验证工具');
  console.log('='.repeat(30));
  setupDatabase();
}
