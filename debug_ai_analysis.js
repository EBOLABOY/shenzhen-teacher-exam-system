#!/usr/bin/env node
/**
 * 调试AI分析问题的脚本
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 需要配置 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugWrongQuestions() {
  console.log('🔍 调试错题数据结构...\n');

  try {
    // 获取错题数据（模拟API调用）
    const { data: wrongQuestions, error: fetchError } = await supabase
      .from('wrong_questions')
      .select(`
        *,
        questions (
          id,
          question,
          options,
          answer,
          subject,
          difficulty,
          explanation
        )
      `)
      .limit(5);

    if (fetchError) {
      console.error('❌ 获取错题数据失败:', fetchError);
      return;
    }

    console.log(`📊 找到 ${wrongQuestions.length} 条错题记录\n`);

    wrongQuestions.forEach((wq, index) => {
      console.log(`=== 错题 ${index + 1} ===`);
      console.log('ID:', wq.id);
      console.log('用户ID:', wq.user_id);
      console.log('题目ID:', wq.question_id);
      console.log('科目:', wq.subject);
      console.log('题型:', wq.question_type);
      console.log('难度:', wq.difficulty);
      console.log('用户答案:', wq.user_answer);
      console.log('正确答案:', wq.correct_answer);
      console.log('错误次数:', wq.wrong_count);
      console.log('是否掌握:', wq.is_mastered);
      
      console.log('\n--- 关联题目信息 ---');
      if (wq.questions) {
        console.log('题目内容:', wq.questions.question ? wq.questions.question.substring(0, 100) + '...' : '无');
        console.log('选项:', wq.questions.options ? 'exists' : 'null/undefined');
        if (wq.questions.options) {
          console.log('选项类型:', typeof wq.questions.options);
          console.log('选项内容:', JSON.stringify(wq.questions.options));
        }
        console.log('答案:', wq.questions.answer);
        console.log('解析:', wq.questions.explanation ? '有' : '无');
      } else {
        console.log('❌ 关联题目信息缺失');
      }
      
      console.log('\n');
    });

    // 测试 Object.entries 操作
    console.log('🧪 测试 Object.entries 操作...\n');
    
    wrongQuestions.forEach((wq, index) => {
      console.log(`测试错题 ${index + 1}:`);
      
      try {
        if (wq.questions && wq.questions.options) {
          const entries = Object.entries(wq.questions.options);
          console.log('✅ Object.entries 成功:', entries.length, '个选项');
        } else {
          console.log('⚠️ 选项为空，跳过');
        }
      } catch (error) {
        console.error('❌ Object.entries 失败:', error.message);
        console.log('选项值:', wq.questions?.options);
        console.log('选项类型:', typeof wq.questions?.options);
      }
    });

  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  }
}

debugWrongQuestions();
