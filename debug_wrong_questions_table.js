// 调试错题表结构问题
// 运行命令: node debug_wrong_questions_table.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugWrongQuestionsTable() {
  console.log('🔍 调试错题表结构问题...\n');

  try {
    // 1. 直接测试错题表是否存在
    console.log('1️⃣ 测试错题表是否存在...');
    const { data: existingData, error: existingError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);

    if (existingError) {
      if (existingError.code === 'PGRST106') {
        console.log('❌ wrong_questions表不存在！');
        return;
      } else {
        console.log('⚠️  查询错题表时出错:', existingError.message);
      }
    } else {
      console.log('✅ wrong_questions表存在');
      if (existingData && existingData.length > 0) {
        console.log('📊 表中已有数据，字段包括:');
        Object.keys(existingData[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof existingData[0][key]}`);
        });
      } else {
        console.log('📊 表存在但无数据');
      }
    }

    // 2. 获取测试数据
    console.log('\n2️⃣ 获取测试数据...');

    // 获取一个测试题目
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, subject, difficulty, type, answer')
      .limit(1);

    if (questionsError || !questions || questions.length === 0) {
      console.log('❌ 没有找到测试题目');
      return;
    }

    const testQuestion = questions[0];
    console.log('✅ 找到测试题目:', testQuestion.id);

    // 3. 测试不同的插入方式
    console.log('\n3️⃣ 测试错题插入...');

    // 方式1: 只插入基本字段（原schema.sql支持的字段）
    console.log('测试方式1: 基本字段插入...');
    const basicData = {
      user_id: '00000000-0000-0000-0000-000000000000', // 测试UUID
      question_id: testQuestion.id,
      wrong_count: 1,
      last_wrong_at: new Date().toISOString(),
      is_mastered: false
    };

    const { data: basicResult, error: basicError } = await supabase
      .from('wrong_questions')
      .insert(basicData)
      .select();

    if (basicError) {
      console.log('❌ 基本字段插入失败:', basicError.message);
    } else {
      console.log('✅ 基本字段插入成功');
      // 清理测试数据
      await supabase.from('wrong_questions').delete().eq('id', basicResult[0].id);
    }

    // 方式2: 尝试插入完整字段（新版本期望的字段）
    console.log('测试方式2: 完整字段插入...');
    const fullData = {
      user_id: '00000000-0000-0000-0000-000000000000',
      question_id: testQuestion.id,
      user_answer: 'A',
      correct_answer: testQuestion.answer,
      question_type: testQuestion.type || 'multiple_choice',
      subject: testQuestion.subject,
      difficulty: testQuestion.difficulty,
      wrong_count: 1,
      first_wrong_at: new Date().toISOString(),
      last_wrong_at: new Date().toISOString(),
      is_mastered: false
    };

    const { data: fullResult, error: fullError } = await supabase
      .from('wrong_questions')
      .insert(fullData)
      .select();

    if (fullError) {
      console.log('❌ 完整字段插入失败:', fullError.message);
      console.log('   错误代码:', fullError.code);
      console.log('   错误详情:', fullError.details);

      // 分析缺失的字段
      if (fullError.message.includes('column') && fullError.message.includes('does not exist')) {
        const missingField = fullError.message.match(/column "([^"]+)" does not exist/);
        if (missingField) {
          console.log(`   缺失字段: ${missingField[1]}`);
        }
      }
    } else {
      console.log('✅ 完整字段插入成功');
      // 清理测试数据
      await supabase.from('wrong_questions').delete().eq('id', fullResult[0].id);
    }

    // 4. 检查现有错题数据
    console.log('\n4️⃣ 检查现有错题数据...');
    const { data: wrongQuestionsData, error: wrongQuestionsError } = await supabase
      .from('wrong_questions')
      .select('*');

    if (wrongQuestionsError) {
      console.log('❌ 获取错题数据失败:', wrongQuestionsError.message);
    } else {
      console.log(`📊 当前错题记录数: ${wrongQuestionsData?.length || 0}`);
      if (wrongQuestionsData && wrongQuestionsData.length > 0) {
        console.log('最近的错题记录:');
        wrongQuestionsData.slice(0, 3).forEach((wq, index) => {
          console.log(`   ${index + 1}. 用户: ${wq.user_id?.substring(0, 8)}..., 题目: ${wq.question_id}, 时间: ${wq.last_wrong_at}`);
        });
      }
    }

    // 5. 生成修复建议
    console.log('\n5️⃣ 修复建议...');
    if (fullError && fullError.message.includes('does not exist')) {
      console.log('🔧 需要更新数据库表结构！');
      console.log('请在Supabase Dashboard的SQL Editor中执行以下SQL:');
      console.log('='.repeat(60));
      console.log(`
-- 更新错题表结构
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS user_answer TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS first_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_wrong_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_wrong_questions_updated_at ON wrong_questions;
CREATE TRIGGER update_wrong_questions_updated_at
    BEFORE UPDATE ON wrong_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_wrong_questions_updated_at();
      `);
      console.log('='.repeat(60));
    } else {
      console.log('✅ 表结构看起来正常，错题功能应该可以正常工作');
    }

  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error.message);
  }
}

// 运行调试
debugWrongQuestionsTable();
