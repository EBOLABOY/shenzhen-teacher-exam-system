#!/usr/bin/env node
/**
 * 更新错题表结构
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 环境变量配置错误');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateWrongQuestionsTable() {
  console.log('🔧 开始更新错题表结构...\n');

  try {
    // 1. 检查当前表结构
    console.log('1. 检查当前表结构...');
    const { data: currentData, error: checkError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ 无法访问错题表:', checkError.message);
      return;
    }

    console.log('✅ 当前表可访问');

    // 2. 添加缺失的字段
    console.log('\n2. 添加缺失的字段...');
    
    const alterQueries = [
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS user_answer TEXT',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS correct_answer TEXT',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS question_type TEXT',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS subject TEXT',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS difficulty TEXT',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS first_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMP WITH TIME ZONE',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      'ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
    ];

    for (const query of alterQueries) {
      try {
        console.log(`执行: ${query}`);
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.error(`❌ 执行失败: ${error.message}`);
        } else {
          console.log('✅ 执行成功');
        }
      } catch (err) {
        console.error(`❌ 执行出错: ${err.message}`);
      }
    }

    // 3. 更新现有数据
    console.log('\n3. 更新现有数据...');
    
    // 获取现有的错题数据
    const { data: existingWrongQuestions, error: fetchError } = await supabase
      .from('wrong_questions')
      .select(`
        *,
        questions (
          question,
          answer,
          type,
          subject,
          difficulty
        )
      `);

    if (fetchError) {
      console.error('❌ 获取现有数据失败:', fetchError.message);
      return;
    }

    console.log(`找到 ${existingWrongQuestions?.length || 0} 条现有错题数据`);

    // 更新每条记录
    if (existingWrongQuestions && existingWrongQuestions.length > 0) {
      for (const wq of existingWrongQuestions) {
        if (wq.questions) {
          const updateData = {
            correct_answer: wq.questions.answer,
            question_type: wq.questions.type,
            subject: wq.questions.subject,
            difficulty: wq.questions.difficulty,
            user_answer: wq.user_answer || 'unknown', // 如果没有用户答案，设为unknown
            first_wrong_at: wq.first_wrong_at || wq.last_wrong_at,
            created_at: wq.created_at || wq.last_wrong_at,
            updated_at: wq.updated_at || wq.last_wrong_at
          };

          const { error: updateError } = await supabase
            .from('wrong_questions')
            .update(updateData)
            .eq('id', wq.id);

          if (updateError) {
            console.error(`❌ 更新记录 ${wq.id} 失败:`, updateError.message);
          } else {
            console.log(`✅ 更新记录 ${wq.id} 成功`);
          }
        }
      }
    }

    // 4. 创建索引
    console.log('\n4. 创建索引...');
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject)',
      'CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_type ON wrong_questions(question_type)',
      'CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered)',
      'CREATE INDEX IF NOT EXISTS idx_wrong_questions_created_at ON wrong_questions(created_at)'
    ];

    for (const query of indexQueries) {
      try {
        console.log(`执行: ${query}`);
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.error(`❌ 执行失败: ${error.message}`);
        } else {
          console.log('✅ 执行成功');
        }
      } catch (err) {
        console.error(`❌ 执行出错: ${err.message}`);
      }
    }

    console.log('\n🎉 错题表结构更新完成！');

  } catch (error) {
    console.error('❌ 更新过程中出错:', error);
  }
}

// 运行更新
updateWrongQuestionsTable().then(() => {
  console.log('\n✅ 更新完成!');
  process.exit(0);
}).catch(error => {
  console.error('❌ 更新失败:', error);
  process.exit(1);
});
