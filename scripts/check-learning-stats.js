#!/usr/bin/env node
/**
 * 检查学习统计功能
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkLearningStats() {
  console.log('📊 检查学习统计功能...\n');
  
  try {
    // 1. 检查题目总数
    console.log('1️⃣ 检查题目总数...');
    const { count: totalQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (questionsError) {
      console.error('❌ 获取题目总数失败:', questionsError.message);
      return;
    }
    
    console.log(`✅ 题目总数: ${totalQuestions} 道`);
    
    // 2. 检查用户答题记录
    console.log('\n2️⃣ 检查用户答题记录...');
    const { count: totalRecords, error: recordsError } = await supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true });
    
    if (recordsError) {
      console.error('❌ 获取答题记录失败:', recordsError.message);
      return;
    }
    
    console.log(`✅ 答题记录总数: ${totalRecords} 条`);
    
    // 3. 检查用户进度统计
    console.log('\n3️⃣ 检查用户进度统计...');
    const { data: userStats, error: statsError } = await supabase
      .from('user_progress')
      .select('*');
    
    if (statsError) {
      console.error('❌ 获取用户统计失败:', statsError.message);
      return;
    }
    
    console.log(`✅ 用户统计记录: ${userStats.length} 个用户`);
    
    // 4. 详细检查每个用户的统计
    console.log('\n4️⃣ 检查用户统计详情...');
    
    for (const user of userStats) {
      console.log(`\n👤 用户: ${user.display_name || user.user_id}`);
      console.log(`   总答题: ${user.total_questions} 道`);
      console.log(`   正确数: ${user.correct_answers} 道`);
      console.log(`   正确率: ${user.total_questions > 0 ? ((user.correct_answers / user.total_questions) * 100).toFixed(1) : 0}%`);
      console.log(`   更新时间: ${user.updated_at}`);

      // 验证统计数据
      const { count: actualAnswered, error: answeredError } = await supabase
        .from('user_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user_id);

      const { count: actualCorrect, error: correctError } = await supabase
        .from('user_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user_id)
        .eq('is_correct', true);

      if (!answeredError && !correctError) {
        const isConsistent = (actualAnswered === user.total_questions && actualCorrect === user.correct_answers);

        if (isConsistent) {
          console.log(`   ✅ 统计数据一致`);
        } else {
          console.log(`   ⚠️  统计数据不一致:`);
          console.log(`      记录: ${user.total_questions}/${user.correct_answers}`);
          console.log(`      实际: ${actualAnswered}/${actualCorrect}`);
        }
      }
    }
    
    // 5. 检查最近的答题活动
    console.log('\n5️⃣ 检查最近答题活动...');
    const { data: recentAnswers, error: recentError } = await supabase
      .from('user_answers')
      .select(`
        id,
        user_id,
        question_id,
        is_correct,
        created_at,
        questions(question, exam_year)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!recentError && recentAnswers) {
      console.log('📝 最近5次答题:');
      recentAnswers.forEach((answer, index) => {
        console.log(`${index + 1}. 用户ID: ${answer.user_id.substring(0, 8)}...`);
        console.log(`   题目: ${answer.questions?.question?.substring(0, 30)}...`);
        console.log(`   结果: ${answer.is_correct ? '✅ 正确' : '❌ 错误'}`);
        console.log(`   时间: ${answer.created_at}`);
      });
    }
    
    // 6. 检查错题记录
    console.log('\n6️⃣ 检查错题记录...');
    const { count: wrongCount, error: wrongError } = await supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true })
      .eq('is_correct', false);
    
    if (!wrongError) {
      console.log(`📋 错题总数: ${wrongCount} 道`);
      
      const wrongRate = totalRecords > 0 ? ((wrongCount / totalRecords) * 100).toFixed(1) : 0;
      console.log(`📊 错题率: ${wrongRate}%`);
    }
    
    // 7. 检查学习进度分布
    console.log('\n7️⃣ 检查学习进度分布...');
    
    if (userStats.length > 0) {
      const progressRanges = {
        '0-10%': 0,
        '11-30%': 0,
        '31-50%': 0,
        '51-70%': 0,
        '71-90%': 0,
        '91-100%': 0
      };
      
      userStats.forEach(user => {
        const progress = user.total_questions > 0 ? (user.total_questions / totalQuestions) * 100 : 0;
        
        if (progress <= 10) progressRanges['0-10%']++;
        else if (progress <= 30) progressRanges['11-30%']++;
        else if (progress <= 50) progressRanges['31-50%']++;
        else if (progress <= 70) progressRanges['51-70%']++;
        else if (progress <= 90) progressRanges['71-90%']++;
        else progressRanges['91-100%']++;
      });
      
      console.log('📈 用户学习进度分布:');
      Object.entries(progressRanges).forEach(([range, count]) => {
        console.log(`   ${range}: ${count} 人`);
      });
    }
    
    // 8. 总结
    console.log('\n📋 学习统计检查总结:');
    console.log('========================');
    console.log(`题目总数: ${totalQuestions} 道`);
    console.log(`答题记录: ${totalRecords} 条`);
    console.log(`用户数量: ${userStats.length} 人`);
    console.log(`错题数量: ${wrongCount || 0} 道`);
    
    // 检查是否需要修复
    const needsFix = userStats.some(user => {
      // 这里可以添加更复杂的检查逻辑
      return user.total_questions < 0 || user.correct_answers < 0 || user.correct_answers > user.total_questions;
    });
    
    if (needsFix) {
      console.log('\n⚠️  发现统计数据异常，建议运行修复脚本:');
      console.log('   npm run fix-progress');
    } else {
      console.log('\n✅ 学习统计功能正常！');
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出现异常:', error.message);
  }
}

if (require.main === module) {
  checkLearningStats()
    .then(() => {
      console.log('\n检查完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('检查失败:', error);
      process.exit(1);
    });
}

module.exports = { checkLearningStats };
