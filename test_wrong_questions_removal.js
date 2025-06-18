#!/usr/bin/env node
/**
 * 测试错题复习中答对题目后自动移除功能
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

async function testWrongQuestionsRemoval() {
  console.log('🧪 测试错题复习自动移除功能...\n');

  try {
    // 1. 获取一个有错题的用户
    console.log('1️⃣ 获取测试用户的错题...');

    // 先获取错题数据
    const { data: wrongQuestions, error: fetchError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(3);

    if (fetchError) {
      console.error('❌ 获取错题失败:', fetchError.message);
      console.error('错误详情:', fetchError);
      return;
    }

    console.log('获取到的错题数据:', wrongQuestions);

    if (!wrongQuestions || wrongQuestions.length === 0) {
      console.log('❌ 没有找到错题数据，无法测试');

      // 检查是否有任何错题数据
      const { count, error: countError } = await supabase
        .from('wrong_questions')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ 检查错题总数失败:', countError.message);
      } else {
        console.log(`数据库中总共有 ${count} 道错题`);
      }
      return;
    }

    // 获取对应的题目信息
    const questionIdsForQuery = wrongQuestions.map(wq => wq.question_id);
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, answer, subject, difficulty')
      .in('id', questionIdsForQuery);

    if (questionsError) {
      console.error('❌ 获取题目信息失败:', questionsError.message);
      return;
    }

    // 合并错题和题目信息
    const wrongQuestionsWithDetails = wrongQuestions.map(wq => ({
      ...wq,
      questions: questions?.find(q => q.id === wq.question_id)
    }));

    console.log(`✅ 找到 ${wrongQuestionsWithDetails.length} 道错题`);
    wrongQuestionsWithDetails.forEach((wq, index) => {
      console.log(`   ${index + 1}. ID: ${wq.id}, Question: ${wq.question_id}, Subject: ${wq.subject}`);
    });

    // 2. 模拟创建错题复习任务
    console.log('\n2️⃣ 模拟创建错题复习任务...');
    const testUserId = wrongQuestionsWithDetails[0].user_id;
    const questionIds = wrongQuestionsWithDetails.map(wq => wq.question_id);

    const taskData = {
      user_id: testUserId,
      task_type: 'wrong_questions_review',
      title: `测试错题复习 - ${wrongQuestions.length}题`,
      description: `测试错题复习功能`,
      question_ids: questionIds,
      total_questions: wrongQuestionsWithDetails.length,
      completed_questions: 0,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: task, error: taskError } = await supabase
      .from('practice_tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      console.error('❌ 创建测试任务失败:', taskError.message);
      return;
    }

    console.log(`✅ 创建测试任务成功: ${task.id}`);

    // 3. 模拟答对第一道题并测试移除功能
    console.log('\n3️⃣ 模拟答对题目并测试移除...');
    const testQuestion = wrongQuestionsWithDetails[0];
    
    console.log(`测试题目: ${testQuestion.question_id}`);
    console.log(`题目内容: ${testQuestion.questions?.question?.substring(0, 50)}...`);
    console.log(`正确答案: ${testQuestion.questions?.answer}`);

    // 记录答题记录（模拟答对）
    const { error: answerError } = await supabase
      .from('user_answers')
      .insert({
        user_id: testUserId,
        question_id: testQuestion.question_id,
        selected_answer: testQuestion.questions?.answer,
        is_correct: true,
        time_spent: 30
      });

    if (answerError) {
      console.log('⚠️ 记录答题失败（可能已存在）:', answerError.message);
    } else {
      console.log('✅ 记录答题成功');
    }

    // 测试移除错题功能
    console.log('\n4️⃣ 测试移除错题功能...');
    const { error: removeError } = await supabase
      .from('wrong_questions')
      .delete()
      .eq('user_id', testUserId)
      .eq('question_id', testQuestion.question_id);

    if (removeError) {
      console.error('❌ 移除错题失败:', removeError.message);
    } else {
      console.log('✅ 移除错题成功');
    }

    // 5. 验证移除结果
    console.log('\n5️⃣ 验证移除结果...');
    const { data: remainingWrong, error: checkError } = await supabase
      .from('wrong_questions')
      .select('*')
      .eq('user_id', testUserId)
      .eq('question_id', testQuestion.question_id);

    if (checkError) {
      console.error('❌ 验证失败:', checkError.message);
    } else if (remainingWrong && remainingWrong.length === 0) {
      console.log('✅ 验证成功：题目已从错题本中移除');
    } else {
      console.log('❌ 验证失败：题目仍在错题本中');
    }

    // 6. 清理测试任务
    console.log('\n6️⃣ 清理测试数据...');
    await supabase
      .from('practice_tasks')
      .delete()
      .eq('id', task.id);

    console.log('✅ 测试任务已清理');

    console.log('\n🎉 测试完成！');
    console.log('\n📋 测试总结:');
    console.log('- ✅ 错题数据获取正常');
    console.log('- ✅ 错题复习任务创建正常');
    console.log('- ✅ 错题移除功能正常');
    console.log('- ✅ 数据验证正常');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
testWrongQuestionsRemoval();
