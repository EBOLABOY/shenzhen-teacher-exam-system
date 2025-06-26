const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * 诊断和修复用户学习统计问题
 * 主要解决题库更新后统计不准确的问题
 */
async function fixUserProgress() {
  console.log('🔍 开始诊断用户学习统计问题...\n');

  try {
    // 1. 检查数据库连接
    console.log('1️⃣ 检查数据库连接...');
    const { data: testData, error: testError } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ 数据库连接失败:', testError.message);
      return;
    }
    console.log(`✅ 数据库连接正常，当前题库共 ${testData} 道题\n`);

    // 2. 获取所有用户
    console.log('2️⃣ 获取用户列表...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name');
    
    if (usersError) {
      console.error('❌ 获取用户列表失败:', usersError.message);
      return;
    }
    console.log(`✅ 找到 ${users.length} 个用户\n`);

    // 3. 检查每个用户的答题记录和进度统计
    console.log('3️⃣ 检查用户答题记录和进度统计...');
    
    for (const user of users) {
      console.log(`\n👤 检查用户: ${user.display_name || user.user_id}`);
      
      // 获取用户答题记录
      const { data: answers, error: answersError } = await supabase
        .from('user_answers')
        .select('question_id, is_correct, time_spent, answered_at')
        .eq('user_id', user.user_id);
      
      if (answersError) {
        console.error(`   ❌ 获取答题记录失败: ${answersError.message}`);
        continue;
      }

      // 获取当前进度统计
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.user_id)
        .single();
      
      // 计算实际统计
      const actualStats = {
        total_questions: answers.length,
        correct_answers: answers.filter(a => a.is_correct).length,
        total_time: answers.reduce((sum, a) => sum + (a.time_spent || 0), 0),
        last_practice_at: answers.length > 0 
          ? answers.reduce((latest, a) => {
              const answerTime = new Date(a.answered_at);
              return answerTime > new Date(latest) ? a.answered_at : latest;
            }, answers[0].answered_at)
          : null
      };

      const accuracy = actualStats.total_questions > 0 
        ? Math.round((actualStats.correct_answers / actualStats.total_questions) * 100) 
        : 0;

      console.log(`   📊 实际统计: ${actualStats.total_questions}题, 正确${actualStats.correct_answers}题 (${accuracy}%)`);
      
      if (progressError || !progress) {
        console.log(`   ⚠️  进度记录不存在，需要创建`);
      } else {
        const currentAccuracy = progress.total_questions > 0 
          ? Math.round((progress.correct_answers / progress.total_questions) * 100) 
          : 0;
        console.log(`   📈 当前统计: ${progress.total_questions}题, 正确${progress.correct_answers}题 (${currentAccuracy}%)`);
        
        // 检查是否需要更新
        if (progress.total_questions !== actualStats.total_questions ||
            progress.correct_answers !== actualStats.correct_answers) {
          console.log(`   🔄 统计不一致，需要更新`);
        } else {
          console.log(`   ✅ 统计一致，无需更新`);
          continue;
        }
      }

      // 更新或创建进度记录
      let updateError;
      if (progressError || !progress) {
        // 创建新记录
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.user_id,
            total_questions: actualStats.total_questions,
            correct_answers: actualStats.correct_answers,
            total_time: actualStats.total_time,
            last_practice_at: actualStats.last_practice_at,
            updated_at: new Date().toISOString()
          });
        updateError = error;
      } else {
        // 更新现有记录
        const { error } = await supabase
          .from('user_progress')
          .update({
            total_questions: actualStats.total_questions,
            correct_answers: actualStats.correct_answers,
            total_time: actualStats.total_time,
            last_practice_at: actualStats.last_practice_at,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.user_id);
        updateError = error;
      }

      if (updateError) {
        console.error(`   ❌ 更新进度失败: ${updateError.message}`);
      } else {
        console.log(`   ✅ 进度更新成功`);
      }
    }

    // 4. 检查是否有孤立的答题记录（引用不存在的题目）
    console.log('\n4️⃣ 检查孤立的答题记录...');
    
    const { data: orphanAnswers, error: orphanError } = await supabase
      .from('user_answers')
      .select(`
        id, 
        user_id, 
        question_id,
        questions!inner(id)
      `);
    
    if (orphanError) {
      console.error('❌ 检查孤立记录失败:', orphanError.message);
    } else {
      // 获取所有答题记录
      const { data: allAnswers, error: allAnswersError } = await supabase
        .from('user_answers')
        .select('id, question_id');
      
      if (!allAnswersError) {
        const validQuestionIds = new Set(orphanAnswers.map(a => a.question_id));
        const orphanRecords = allAnswers.filter(a => !validQuestionIds.has(a.question_id));
        
        if (orphanRecords.length > 0) {
          console.log(`⚠️  发现 ${orphanRecords.length} 条孤立的答题记录（引用已删除的题目）`);
          console.log('   这些记录可能是题库更新时产生的');
          
          // 询问是否清理孤立记录
          console.log('   建议清理这些孤立记录以确保统计准确性');
          
          // 清理孤立记录
          const orphanIds = orphanRecords.map(r => r.id);
          const { error: cleanupError } = await supabase
            .from('user_answers')
            .delete()
            .in('id', orphanIds);
          
          if (cleanupError) {
            console.error('❌ 清理孤立记录失败:', cleanupError.message);
          } else {
            console.log('✅ 孤立记录清理完成');
            
            // 重新同步所有用户进度
            console.log('\n5️⃣ 重新同步所有用户进度...');
            for (const user of users) {
              await syncUserProgress(user.user_id);
            }
          }
        } else {
          console.log('✅ 未发现孤立的答题记录');
        }
      }
    }

    console.log('\n🎉 用户学习统计修复完成！');
    console.log('💡 建议：');
    console.log('   1. 在管理员页面刷新查看最新统计');
    console.log('   2. 今后更新题库时，考虑保留题目ID或提供数据迁移方案');
    console.log('   3. 定期运行此脚本检查数据一致性');

  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  }
}

/**
 * 同步单个用户的进度统计
 */
async function syncUserProgress(userId) {
  try {
    // 获取用户的所有答题记录
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('is_correct, time_spent, answered_at')
      .eq('user_id', userId);

    if (answersError) {
      console.error(`同步用户 ${userId} 进度失败:`, answersError.message);
      return;
    }

    // 计算统计数据
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.is_correct).length;
    const totalTime = answers.reduce((sum, a) => sum + (a.time_spent || 0), 0);
    
    const lastPracticeAt = answers.length > 0 
      ? answers.reduce((latest, a) => {
          const answerTime = new Date(a.answered_at);
          return answerTime > new Date(latest) ? a.answered_at : latest;
        }, answers[0].answered_at)
      : null;

    // 更新用户进度表
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        total_time: totalTime,
        last_practice_at: lastPracticeAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error(`更新用户 ${userId} 进度失败:`, updateError.message);
    }
  } catch (error) {
    console.error(`同步用户 ${userId} 进度时出现错误:`, error);
  }
}

// 运行修复脚本
if (require.main === module) {
  fixUserProgress().then(() => {
    console.log('\n脚本执行完成');
    process.exit(0);
  }).catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { fixUserProgress, syncUserProgress };
