#!/usr/bin/env node
/**
 * 检查错题数据库状态
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

async function checkWrongQuestions() {
  console.log('🔍 检查错题数据库状态...\n');

  try {
    // 1. 检查错题表是否存在
    console.log('1. 检查错题表结构...');
    const { data: tables, error: tableError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ 错题表不存在或无法访问:', tableError.message);
      return;
    }
    console.log('✅ 错题表存在');

    // 2. 检查错题总数
    console.log('\n2. 检查错题总数...');
    const { count, error: countError } = await supabase
      .from('wrong_questions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 获取错题总数失败:', countError.message);
      return;
    }
    console.log(`✅ 错题总数: ${count} 条`);

    // 3. 检查用户错题分布
    console.log('\n3. 检查用户错题分布...');
    const { data: userWrongQuestions, error: userStatsError } = await supabase
      .from('wrong_questions')
      .select('user_id');

    if (userStatsError) {
      console.error('❌ 获取用户统计失败:', userStatsError.message);
    } else if (userWrongQuestions && userWrongQuestions.length > 0) {
      const userCounts = {};
      userWrongQuestions.forEach(item => {
        userCounts[item.user_id] = (userCounts[item.user_id] || 0) + 1;
      });
      console.log('用户错题分布:');
      Object.entries(userCounts).forEach(([userId, count]) => {
        console.log(`  - 用户 ${userId.substring(0, 8)}...: ${count} 题`);
      });
    } else {
      console.log('暂无用户错题数据');
    }

    // 4. 检查最近的错题
    console.log('\n4. 检查最近的错题...');
    const { data: recentWrong, error: recentError } = await supabase
      .from('wrong_questions')
      .select(`
        *,
        questions (
          id,
          question,
          subject,
          difficulty,
          type,
          options,
          answer
        )
      `)
      .order('last_wrong_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ 获取最近错题失败:', recentError.message);
      console.error('错误详情:', recentError);
    } else {
      console.log('最近5道错题:');
      recentWrong?.forEach((wq, index) => {
        console.log(`  ${index + 1}. ID: ${wq.id}, Question ID: ${wq.question_id}`);
        console.log(`     题目: ${wq.questions?.question?.substring(0, 50) || '无关联题目'}...`);
        console.log(`     错题表科目: ${wq.subject}, 题目表科目: ${wq.questions?.subject || '无'}`);
        console.log(`     错题表难度: ${wq.difficulty}, 题目表难度: ${wq.questions?.difficulty || '无'}`);
        console.log(`     用户答案: ${wq.user_answer}, 正确答案: ${wq.questions?.answer || '无'}`);
        console.log(`     is_mastered: ${wq.is_mastered}`);
        console.log(`     错误时间: ${new Date(wq.last_wrong_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 5. 检查科目分布
    console.log('\n5. 检查科目分布...');
    const { data: subjectWrongQuestions, error: subjectError } = await supabase
      .from('wrong_questions')
      .select('subject');

    if (subjectError) {
      console.error('❌ 获取科目统计失败:', subjectError.message);
    } else if (subjectWrongQuestions && subjectWrongQuestions.length > 0) {
      const subjectCounts = {};
      subjectWrongQuestions.forEach(item => {
        subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
      });
      console.log('科目错题分布:');
      Object.entries(subjectCounts).forEach(([subject, count]) => {
        console.log(`  - ${subject}: ${count} 题`);
      });
    } else {
      console.log('暂无科目错题数据');
    }

  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  }
}

// 运行检查
checkWrongQuestions().then(() => {
  console.log('\n🎉 检查完成!');
  process.exit(0);
}).catch(error => {
  console.error('❌ 检查失败:', error);
  process.exit(1);
});
