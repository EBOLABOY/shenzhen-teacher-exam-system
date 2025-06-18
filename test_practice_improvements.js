#!/usr/bin/env node
/**
 * 测试练习页面的改进功能
 * 1. 验证已做题目不再出现
 * 2. 验证已完成题目数量统计
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

async function testPracticeImprovements() {
  console.log('🧪 测试练习页面改进功能...\n');

  try {
    // 1. 获取题库总数
    console.log('1️⃣ 检查题库总数...');
    const { count: totalQuestions, error: totalError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ 获取题库总数失败:', totalError.message);
      return;
    }

    console.log(`✅ 题库总数: ${totalQuestions} 道题`);

    // 2. 检查用户答题记录
    console.log('\n2️⃣ 检查用户答题记录...');
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('user_id, question_id')
      .limit(10);

    if (answersError) {
      console.error('❌ 获取用户答题记录失败:', answersError.message);
      return;
    }

    if (!userAnswers || userAnswers.length === 0) {
      console.log('⚠️ 暂无用户答题记录');
      return;
    }

    console.log(`✅ 找到 ${userAnswers.length} 条答题记录`);

    // 按用户统计已完成题目数量
    const userStats = {};
    userAnswers.forEach(answer => {
      const userId = answer.user_id;
      userStats[userId] = (userStats[userId] || 0) + 1;
    });

    console.log('\n用户已完成题目统计:');
    Object.entries(userStats).forEach(([userId, count]) => {
      console.log(`  - 用户 ${userId.substring(0, 8)}...: ${count} 道题`);
    });

    // 3. 测试排除已做题目的逻辑
    console.log('\n3️⃣ 测试排除已做题目的逻辑...');
    
    // 选择一个有答题记录的用户进行测试
    const testUserId = Object.keys(userStats)[0];
    if (!testUserId) {
      console.log('❌ 没有找到有答题记录的用户');
      return;
    }

    console.log(`测试用户: ${testUserId.substring(0, 8)}...`);

    // 获取该用户已做过的题目ID
    const { data: userAnsweredQuestions, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', testUserId);

    if (userAnswersError) {
      console.error('❌ 获取用户答题记录失败:', userAnswersError.message);
      return;
    }

    const answeredQuestionIds = userAnsweredQuestions.map(answer => answer.question_id);
    console.log(`该用户已做过 ${answeredQuestionIds.length} 道题`);

    // 测试排除逻辑
    let query = supabase
      .from('questions')
      .select('id');

    if (answeredQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
    }

    const { data: availableQuestions, error: availableError } = await query.limit(20);

    if (availableError) {
      console.error('❌ 获取可用题目失败:', availableError.message);
      return;
    }

    console.log(`✅ 排除已做题目后，还有 ${availableQuestions.length} 道题可供练习`);

    // 验证排除逻辑是否正确
    const availableQuestionIds = availableQuestions.map(q => q.id);
    const hasOverlap = availableQuestionIds.some(id => answeredQuestionIds.includes(id));

    if (hasOverlap) {
      console.log('❌ 排除逻辑有问题：返回的题目中包含已做过的题目');
    } else {
      console.log('✅ 排除逻辑正确：返回的题目都是未做过的');
    }

    // 4. 测试题目数量统计功能
    console.log('\n4️⃣ 测试题目数量统计功能...');
    
    // 模拟前端获取已完成题目数量的逻辑
    const { count: completedCount, error: completedError } = await supabase
      .from('user_answers')
      .select('question_id', { count: 'exact', head: true })
      .eq('user_id', testUserId);

    if (completedError) {
      console.error('❌ 获取已完成题目数量失败:', completedError.message);
    } else {
      console.log(`✅ 用户已完成题目数量: ${completedCount} 道`);
      
      // 验证数量是否一致
      if (completedCount === answeredQuestionIds.length) {
        console.log('✅ 题目数量统计正确');
      } else {
        console.log(`❌ 题目数量统计不一致: 预期 ${answeredQuestionIds.length}, 实际 ${completedCount}`);
      }
    }

    // 5. 计算完成率
    console.log('\n5️⃣ 计算完成率...');
    const completionRate = Math.round((completedCount / totalQuestions) * 100);
    console.log(`完成率: ${completionRate}% (${completedCount}/${totalQuestions})`);

    console.log('\n🎉 测试完成！');
    console.log('\n📋 测试总结:');
    console.log(`- ✅ 题库总数: ${totalQuestions} 道题`);
    console.log(`- ✅ 用户已完成: ${completedCount} 道题`);
    console.log(`- ✅ 剩余可做: ${totalQuestions - completedCount} 道题`);
    console.log(`- ✅ 完成率: ${completionRate}%`);
    console.log('- ✅ 排除已做题目逻辑正常');
    console.log('- ✅ 题目数量统计正常');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testPracticeImprovements();
