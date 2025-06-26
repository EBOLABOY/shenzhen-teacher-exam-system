const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * 检查数据完整性和一致性
 * 用于定期检查系统数据状态
 */
async function checkDataIntegrity() {
  console.log('🔍 开始检查数据完整性...\n');

  try {
    // 1. 检查题库状态
    console.log('1️⃣ 检查题库状态...');
    const { count: totalQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (questionsError) {
      console.error('❌ 获取题库信息失败:', questionsError.message);
      return;
    }
    console.log(`✅ 题库状态正常，共 ${totalQuestions} 道题\n`);

    // 2. 检查用户答题记录
    console.log('2️⃣ 检查用户答题记录...');
    const { count: totalAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true });
    
    if (answersError) {
      console.error('❌ 获取答题记录失败:', answersError.message);
      return;
    }
    console.log(`✅ 答题记录正常，共 ${totalAnswers} 条记录\n`);

    // 3. 检查用户进度统计
    console.log('3️⃣ 检查用户进度统计...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name');
    
    if (usersError) {
      console.error('❌ 获取用户列表失败:', usersError.message);
      return;
    }

    let inconsistentCount = 0;
    const issues = [];

    for (const user of users) {
      // 获取实际答题记录
      const { data: answers, error: userAnswersError } = await supabase
        .from('user_answers')
        .select('is_correct')
        .eq('user_id', user.user_id);
      
      if (userAnswersError) {
        issues.push(`用户 ${user.display_name || user.user_id}: 无法获取答题记录`);
        continue;
      }

      // 获取进度统计
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('total_questions, correct_answers')
        .eq('user_id', user.user_id)
        .single();
      
      const actualTotal = answers.length;
      const actualCorrect = answers.filter(a => a.is_correct).length;
      
      if (progressError || !progress) {
        if (actualTotal > 0) {
          issues.push(`用户 ${user.display_name || user.user_id}: 有 ${actualTotal} 条答题记录但无进度统计`);
          inconsistentCount++;
        }
      } else {
        if (progress.total_questions !== actualTotal || progress.correct_answers !== actualCorrect) {
          issues.push(`用户 ${user.display_name || user.user_id}: 统计不一致 (实际: ${actualTotal}/${actualCorrect}, 记录: ${progress.total_questions}/${progress.correct_answers})`);
          inconsistentCount++;
        }
      }
    }

    if (inconsistentCount === 0) {
      console.log('✅ 所有用户进度统计一致\n');
    } else {
      console.log(`⚠️  发现 ${inconsistentCount} 个用户的统计不一致:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 建议运行 fix-user-progress.js 修复这些问题\n');
    }

    // 4. 检查孤立记录
    console.log('4️⃣ 检查孤立记录...');
    
    // 检查引用不存在题目的答题记录
    const { data: orphanAnswers, error: orphanError } = await supabase
      .rpc('check_orphan_answers');
    
    if (orphanError) {
      // 如果RPC不存在，使用备用方法
      const { data: validAnswers, error: validError } = await supabase
        .from('user_answers')
        .select(`
          id, 
          question_id,
          questions!inner(id)
        `);
      
      if (!validError) {
        const { data: allAnswers, error: allError } = await supabase
          .from('user_answers')
          .select('id, question_id');
        
        if (!allError) {
          const validQuestionIds = new Set(validAnswers.map(a => a.question_id));
          const orphanRecords = allAnswers.filter(a => !validQuestionIds.has(a.question_id));
          
          if (orphanRecords.length > 0) {
            console.log(`⚠️  发现 ${orphanRecords.length} 条孤立的答题记录`);
            console.log('   这些记录引用了已删除的题目，建议清理\n');
          } else {
            console.log('✅ 未发现孤立的答题记录\n');
          }
        }
      }
    }

    // 5. 生成报告
    console.log('📊 数据完整性报告:');
    console.log(`   题库总数: ${totalQuestions} 道题`);
    console.log(`   答题记录: ${totalAnswers} 条`);
    console.log(`   用户总数: ${users.length} 个`);
    console.log(`   统计异常: ${inconsistentCount} 个用户`);
    
    if (inconsistentCount > 0) {
      console.log('\n🔧 修复建议:');
      console.log('   1. 运行: node scripts/fix-user-progress.js');
      console.log('   2. 或在管理员页面点击"同步统计"按钮');
      console.log('   3. 定期运行此检查脚本确保数据一致性');
    } else {
      console.log('\n✅ 数据完整性检查通过！');
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  }
}

/**
 * 快速健康检查
 */
async function quickHealthCheck() {
  try {
    const { count: questions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    const { count: answers } = await supabase
      .from('user_answers')
      .select('*', { count: 'exact', head: true });
    
    const { count: users } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 系统状态: ${questions}题 | ${answers}答题 | ${users}用户`);
    return { questions, answers, users };
  } catch (error) {
    console.error('健康检查失败:', error);
    return null;
  }
}

// 根据命令行参数决定运行哪个检查
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    quickHealthCheck().then(() => {
      console.log('快速检查完成');
      process.exit(0);
    }).catch(error => {
      console.error('快速检查失败:', error);
      process.exit(1);
    });
  } else {
    checkDataIntegrity().then(() => {
      console.log('\n检查完成');
      process.exit(0);
    }).catch(error => {
      console.error('检查失败:', error);
      process.exit(1);
    });
  }
}

module.exports = { checkDataIntegrity, quickHealthCheck };
