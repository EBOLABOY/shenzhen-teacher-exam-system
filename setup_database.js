#!/usr/bin/env node
/**
 * 数据库设置脚本
 * 创建错题库和AI分析相关的数据库表
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 需要配置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.log('请在 .env.local 文件中添加:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🔧 开始设置数据库...\n');

  try {
    // 1. 创建错题库表
    console.log('📝 创建错题库表...');
    const { error: wrongQuestionsError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (wrongQuestionsError) {
      console.error('❌ 创建错题库表失败:', wrongQuestionsError);
    } else {
      console.log('✅ 错题库表创建成功');
    }

    // 2. 创建索引
    console.log('📝 创建索引...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
        CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
        CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_type ON wrong_questions(question_type);
        CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);
        CREATE INDEX IF NOT EXISTS idx_wrong_questions_created_at ON wrong_questions(created_at);
      `
    });

    if (indexError) {
      console.error('❌ 创建索引失败:', indexError);
    } else {
      console.log('✅ 索引创建成功');
    }

    // 3. 创建AI分析表
    console.log('📝 创建AI分析表...');
    const { error: aiAnalysisError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (aiAnalysisError) {
      console.error('❌ 创建AI分析表失败:', aiAnalysisError);
    } else {
      console.log('✅ AI分析表创建成功');
    }

    // 4. 创建AI分析表索引
    console.log('📝 创建AI分析表索引...');
    const { error: aiIndexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
        CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);
        CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);
      `
    });

    if (aiIndexError) {
      console.error('❌ 创建AI分析表索引失败:', aiIndexError);
    } else {
      console.log('✅ AI分析表索引创建成功');
    }

    // 5. 设置RLS策略
    console.log('📝 设置RLS策略...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- 启用RLS
        ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

        -- 错题库RLS策略
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

        -- AI分析RLS策略
        DROP POLICY IF EXISTS "Users can view own ai analysis" ON ai_analysis;
        DROP POLICY IF EXISTS "Users can insert own ai analysis" ON ai_analysis;

        CREATE POLICY "Users can view own ai analysis" ON ai_analysis
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own ai analysis" ON ai_analysis
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    });

    if (rlsError) {
      console.error('❌ 设置RLS策略失败:', rlsError);
    } else {
      console.log('✅ RLS策略设置成功');
    }

    // 6. 创建更新触发器
    console.log('📝 创建更新触发器...');
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        -- 创建更新时间触发器函数
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- 创建触发器
        DROP TRIGGER IF EXISTS update_wrong_questions_updated_at ON wrong_questions;
        CREATE TRIGGER update_wrong_questions_updated_at 
          BEFORE UPDATE ON wrong_questions 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (triggerError) {
      console.error('❌ 创建更新触发器失败:', triggerError);
    } else {
      console.log('✅ 更新触发器创建成功');
    }

    // 7. 验证表结构
    console.log('\n📊 验证表结构...');
    
    const { data: wrongQuestionsColumns, error: verifyError1 } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(0);

    if (verifyError1) {
      console.error('❌ 验证错题库表失败:', verifyError1);
    } else {
      console.log('✅ 错题库表结构验证成功');
    }

    const { data: aiAnalysisColumns, error: verifyError2 } = await supabase
      .from('ai_analysis')
      .select('*')
      .limit(0);

    if (verifyError2) {
      console.error('❌ 验证AI分析表失败:', verifyError2);
    } else {
      console.log('✅ AI分析表结构验证成功');
    }

    console.log('\n🎉 数据库设置完成！');
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
  console.log('🔧 数据库设置工具');
  console.log('='.repeat(30));
  setupDatabase();
}
